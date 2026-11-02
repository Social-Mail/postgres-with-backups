import { CompleteMultipartUploadCommand, CreateMultipartUploadCommand, CreateMultipartUploadCommandOutput, HeadObjectCommand, S3Client, UploadPartCopyCommand } from "@aws-sdk/client-s3";
import TaskManager from "./TaskManager.js";

export default class S3Copy {

    public readonly Bucket: string;
    public readonly Key: string;
    public readonly SourceBucket: string;
    public readonly SourceKey: string;
    public readonly ChecksumAlgorithm = "CRC64NVME";
    public readonly ChecksumType = "FULL_OBJECT";

    tm: TaskManager;

    constructor(
        private client: S3Client,
        { SourceBucket, SourceKey, Bucket, Key }
    ) {
        this.SourceBucket = SourceBucket;
        this.SourceKey = SourceKey;
        this.Bucket = Bucket;
        this.Key = Key;

        this.tm = new TaskManager();
    }

    async upload() {

    
        const uploadRequest = await this.client.send(new CreateMultipartUploadCommand({
            Bucket: this.Bucket,
            Key: this.Key,
        }));

        const BlockSize = 5*1024*1024*1024;

        const all = [];

        let i = 0;

        const headResponse = await this.client.send(
            new HeadObjectCommand({ Bucket: this.SourceBucket, Key: this.SourceKey })
        );
        const total = headResponse.ContentLength;;

        for(let start = 0; start < total; start += BlockSize) {
            const partNumber = ++i;
            const till = Math.min(total, start + BlockSize);
            all.push(await this.tm.queueRun(() => this.uploadBlock(partNumber, uploadRequest, start, till)));
        }

        const Parts = await Promise.all(all);

        await this.client.send(new CompleteMultipartUploadCommand({
            Bucket: this.Bucket,
            Key: this.Key,
            UploadId: uploadRequest.UploadId,
            ChecksumType: this.ChecksumType,
            MultipartUpload: {
                Parts
            }
        }));

        console.log(`${this.SourceBucket}/${this.SourceKey} copied to ${this.Bucket}/${this.Key}`);

    }

    async uploadBlock(
        PartNumber: number,
        uploadRequest: CreateMultipartUploadCommandOutput,
        start,
        till
    ) {

        const r = await this.client.send(new UploadPartCopyCommand({
            Bucket: this.Bucket,
            Key: this.Key,
            PartNumber,
            UploadId: uploadRequest.UploadId,
            CopySource: `${this.SourceBucket}/${this.SourceKey}`,
            CopySourceRange: `bytes=${start}-${till-1}`
        }));

        return {
            ETag: r.CopyPartResult.ETag,
            PartNumber
        };


    }


    

}