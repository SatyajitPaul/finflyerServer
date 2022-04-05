const User = require('../models/User');
const Company = require('../models/Company');
const ErrorResponse = require('../utils/errorResponse');

exports.register = async(req, res, next) => {
    const { firstname, lastname, username, email, phone, password, userType, companyId } = req.body;

    try {
        const Com = await Company.findOneOrCreate({  name: companyId }, new Company({ name: companyId }));
        const user = new User({
            firstname,
            lastname,
            username: username || email.split("@")[0],
            email,
            phone,
            password,
            userType,
            companyId: Com._id
        });

        user.save((err, doc) => {
            if (err) {
                return res.status(400).json({
                    error: `Unable To Save:${err.message}`
                });
            }
            sendToken(user, 201, res);
        });
    }catch(err){
        next(err);
    }

}



exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ErrorResponse('Please provide email and password', 400));
    }
    try {
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return next(new ErrorResponse('Invalid Credentials', 401));
        }
        const isMatch = await user.matchPassword(password);
        if (isMatch) {
            sendToken(user, 201, res);
        }
        return next(new ErrorResponse('Invalid Credentials', 401));
    }catch (err) {
        next(err);
    }

}


exports.forgetpassword = async (req, res, next) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return next(new ErrorResponse('Invalid Credentials', 401));
        }

        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`;
        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

        try {} catch (err) {
            console.log(err);
            return next(new ErrorResponse('Email could not be sent', 500));
        }
    }catch(err){
        next(err);
    }

}


exports.resetpassword = (req, res, next) => {
    res.send('auth login');

}



const sendToken = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();
    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        )
    };
    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token
    });
}
