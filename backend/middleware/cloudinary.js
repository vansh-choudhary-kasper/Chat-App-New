const fs = require('fs');
const cloudinary = require('cloudinary').v2;



const uploadToCloudinary = (file, fileType) => {

    return new Promise((resolve, reject) => {
      let uploadOptions = {};
  

      switch (fileType) {
        case 'video':
          uploadOptions.resource_type = 'video'; 
          break;
        case 'zip':
          uploadOptions.resource_type = 'raw'; 
          uploadOptions.format = 'zip';
          break;
        case 'pdf': 
          uploadOptions.resource_type = 'raw'; 
          uploadOptions.format = 'pdf';
          break;
        case 'image':
          uploadOptions.resource_type = 'image'; 
          break;
        default:
          return reject(new Error('Unsupported file type'));
      }

      const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
 
  
      cloudinary.uploader.upload(base64Data, uploadOptions, async (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result); 
        }
      });
    });
  };
module.exports = uploadToCloudinary
