'use strict';

const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event, context) => {
  const bucketName = event.Records[0].s3.bucket.name;
  const fileName = 'images.json';

  try {
    let imageArray = [];

    // Download the images.json file if it exists
    const downloadParams = {
      Bucket: bucketName,
      Key: fileName,
    };

    try {
      const data = await s3.getObject(downloadParams).promise();
      imageArray = JSON.parse(data.Body.toString());
    } catch (err) {
      if (err.code !== 'NoSuchKey') {
        throw err;
      }
      // If the file doesn't exist, create an empty array
      imageArray = [];
    }

    // Assuming you have image metadata in the 'metadata' variable
    const imageMetadata = {
      name: 'example.jpg',
      size: '1024KB',
      type: 'jpeg',
      // Add more metadata properties as needed
    };

    // Check if the image name already exists in the imageArray
    const existingImageIndex = imageArray.findIndex(image => image.name === imageMetadata.name);

    if (existingImageIndex !== -1) {
      // If the image name exists, update the existing object
      imageArray[existingImageIndex] = { ...imageArray[existingImageIndex], ...imageMetadata };
    } else {
      // If the image name is not a duplicate, simply add it to the array
      imageArray.push(imageMetadata);
    }

    // Upload the updated images.json file back to the S3 bucket
    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
      Body: JSON.stringify(imageArray),
      ContentType: 'application/json',
    };

    await s3.upload(uploadParams).promise();

    return {
      statusCode: 200,
      body: 'Image metadata updated successfully.',
    };
  } catch (err) {
    console.error('Error updating image metadata:', err);
    return {
      statusCode: 500,
      body: 'Error updating image metadata.',
    };
  }
};