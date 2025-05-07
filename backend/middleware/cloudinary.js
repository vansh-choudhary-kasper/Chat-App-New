const fs = require('fs');
const cloudinary = require('cloudinary').v2;



const uploadToCloudinary = (filePath, fileType) => {

    return new Promise((resolve, reject) => {
      let uploadOptions = {};
  

      switch (fileType) {
        case 'video':
          uploadOptions.resource_type = 'video'; 
          break;
        case 'zip':
          uploadOptions.resource_type = 'raw'; 
          break;
        case 'pdf': 
          uploadOptions.resource_type = 'raw'; 
          break;
        case 'image':
          uploadOptions.resource_type = 'image'; 
          break;
        default:
          return reject(new Error('Unsupported file type'));
      }
 
  
      cloudinary.uploader.upload(filePath, uploadOptions, (error, result) => {
        if (error) {
          reject(error);
        } else {
          
         
          fs.unlink(filePath, (err) => {
            if (err) console.log('Error deleting file:', err);
          });
          resolve(result); 
        }
      });
    });
  };
module.exports = uploadToCloudinary
