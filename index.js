const sharp = require("sharp");
const aws = require("aws-sdk");
const s3 = new aws.S3();

const Bucket = "withyou-resource.teamonewayticket";
const transforms = [
  { name: "w_480", width: 480 },
  { name: "w_960", width: 960 }
];

exports.handler = async (event, context, callback) => {

  const key = event.Records[0].s3.object.key;
  const sanitizedKey = key.replace(/\+/g, " ");
  const parts = sanitizedKey.split("/");
  const resizedDirArr = parts.slice(1,parts.length);
  const resizedDir = resizedDirArr.join('/');
  const originDir = `origins/${resizedDir}`; 
  console.log('resizedDir: '+resizedDir);
  console.log('originDir: '+originDir);
  
  try {
    const image = await s3.getObject({ Bucket, Key: originDir }).promise();

    await Promise.all(
      transforms.map(async item => {
        const resizedImg = await sharp(image.Body)
          .resize({ width: item.width })
          .toBuffer();
        
        console.log(`resized/${item.name}/${resizedDir}`);
        return await s3
          .putObject({
            Bucket,
            Body: resizedImg,
            Key: `resized/${item.name}/${resizedDir}`,
          })
          .promise();
      })
    );
    callback(null, `Success: ${originDir}`);
  } catch (err) {
    callback(`Error resizing files: ${err}`);
    console.log(err);
  }
  console.log('successfully resized');
};