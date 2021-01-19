const express = require( 'express' );

const authController = require( '../controllers/auth' );
const {
    check
} = require( 'express-validator/check' )

const router = express.Router();

router.get( '/login', authController.getLogin );

router.get( '/signup', check( 'email' ).isEmail(), authController.getSignup );

router.post( '/login', authController.postLogin );

router.post( '/signup', authController.postSignup );

router.post( '/logout', authController.postLogout );
router.get( '/reset', authController.resetPassword ) //renders the reset password form
router.post( '/reset', authController.postResetPassword ); //form to enter email in order to receive a token
router.get( '/reset/:token', authController.getNewPassword ) //compare tokens from mail and display password confirmation form
router.post( '/new-password', authController.postNewPassword ) //post the updated new password


module.exports = router;