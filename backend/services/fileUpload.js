const fs = require('fs');

exports.uploadToS3 = async (s3, filePath, key) => {
  const fileContent = fs.readFileSync(filePath);

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: fileContent,
    ContentType: 'application/pdf'
  };

  const data = await s3.upload(params).promise();
  return data.Location;
};

exports.uploadToS3Content = async (s3, filePath, key, contentType = 'application/octet-stream') => {
  const fileContent = fs.readFileSync(filePath);

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: fileContent,
    ContentType: contentType 
  };

  const data = await s3.upload(params).promise();
  return {
    http_location: data.Location, 
    s3_location: `s3://${process.env.AWS_BUCKET_NAME}/${key}`
  };

};


exports.uploadToS3JsonObject = async (s3, jsonObject, key) => {

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: JSON.stringify(jsonObject, null, 2),
    ContentType: 'application/json'
  };

  const data = await s3.upload(params).promise();
  return {
    http_location: data.Location, 
    s3_location: `s3://${process.env.AWS_BUCKET_NAME}/${key}`
  };
};