'use strict';
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event, context) => {
  // Extract bucket and object information from the event
  const bucketName = event.Records[0].s3.bucket.name;
  const objectKey = event.Records[0].s3.object.key;
  
  // Check if images.json exists in the S3 bucket
  let existingImages = [];
  try {
    const existingData = await s3.getObject({ Bucket: bucketName, Key: 'images.json' }).promise();
    existingImages = JSON.parse(existingData.Body.toString('utf-8'));
  } catch (err) {
    // The file doesn't exist, so leave the existingImages as an empty array
  }
  
  // Get image metadata
  const imageName = objectKey.split('/').pop();
  const imageType = objectKey.split('.').pop();
  const imageMetadata = {
    Name: imageName,
    Type: imageType,
    Size: event.Records[0].s3.object.size, // Size in bytes
    // Add more metadata fields as needed
  };
  
  // Find and update the image data if it's a duplicate name
  const existingIndex = existingImages.findIndex(image => image.Name === imageName);
  if (existingIndex !== -1) {
    existingImages[existingIndex] = imageMetadata;
  } else {
    existingImages.push(imageMetadata);
  }
  
  // Save the updated images.json back to the S3 bucket
  await s3.putObject({
    Bucket: bucketName,
    Key: 'images.json',
    Body: JSON.stringify(existingImages),
    ContentType: 'application/json',
  }).promise();
  
  return {
    statusCode: 200,
    body: 'Successfully processed the image.',
  };
};