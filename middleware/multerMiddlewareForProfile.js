const path = require('path');

const multer = require('multer');
const imageTypes = /^(image\/(jpeg|png|svg|jpg|webp))$/i;



const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/img/profileImages'));

    },
    filename: function (req, file, cb) {



        const name = file.fieldname + Date.now() + '_' + file.originalname;
        cb(null, name);
    }
})

const upload = multer({

    storage: storage,
    fileFilter: function (req, file, cb) {



        const extname = imageTypes.test(path.extname(file.originalname).toLowerCase());

        const mimetype = imageTypes.test(file.mimetype);

        if (mimetype) {


            return cb(null, true);
        } else {
            // Render the error page

            cb(new Error('Failed to add image: wrong file type'));



        }
    }
})


module.exports = { upload }
