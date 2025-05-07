const filterObj = (obj, ...allowedFields) => {
  try {
    const newObj = {};
    Object.keys(obj).forEach((val) => {
      if (allowedFields.includes(val)) {
        if(val === "password" || val === "confirmPassword"){
          newObj[val] = obj[val];
        }else{
          newObj[val] = obj[val].toLowerCase();
        }
      }
    });

    return newObj;
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = filterObj;
