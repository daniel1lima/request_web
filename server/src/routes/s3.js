const AWS = require('aws-sdk');
const express = require("express");
const fileUpload = require('express-fileupload');
const { v4: uuidv4 } = require('uuid');
require("dotenv").config();

const router = express.Router();

const s3 = new AWS.S3({ region: process.env.AWS_REGION });

// Enable file upload middleware
router.use(fileUpload());

router.post('/upload', async (req, res) => {
    if (!req.files || !req.files.file) {
        return res.status(400).send({ error: 'No file uploaded' });
    }

    const file = req.files.file; // Access the uploaded file
    const fileKey = `${uuidv4()}-${file.name}`;

    const s3Params = {
        Bucket: process.env.S3_BUCKET,
        Key: fileKey,
        Body: file.data, // Directly use the file buffer
        ContentType: file.mimetype
    };

    try {
        const uploadResult = await s3.upload(s3Params).promise();

        // Generate presigned URL
        const presignedUrlParams = {
            Bucket: process.env.S3_BUCKET,
            Key: fileKey,
            Expires: 60 * 60 // URL expires in 1 hour
        };

        const presignedUrl = s3.getSignedUrl('getObject', presignedUrlParams);

        res.status(200).send({
            message: 'File uploaded successfully',
            url: uploadResult.Location,
            fileKey: fileKey,
            presignedUrl: presignedUrl
        });
    } catch (err) {
        res.status(500).send({ error: 'Upload failed', details: err.message });
    }
});

router.post("/fetchFile", async (req, res) => {
    const { fileKey } = req.body;

    const presignedUrlParams = {
        Bucket: process.env.S3_BUCKET,
        Key: fileKey,
        Expires: 60 * 60 // URL expiration time in seconds (1 hour)
    };

    try {
        const presignedUrl = s3.getSignedUrl('getObject', presignedUrlParams);
        res.status(200).send({
            message: 'File fetched successfully',
            presignedUrl: presignedUrl
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch file" });
    }
});

module.exports = router;
