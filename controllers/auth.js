const User = require( '../models/user' );
const bcrypt = require( 'bcryptjs' );
const nodemailer = require( 'nodemailer' )
const sendGridTransporter = require( 'nodemailer-sendgrid-transport' );
const crypto = require( 'crypto' );
const {
  validationresult
} = require( 'express-validator' )

const transporter = nodemailer.createTransport( sendGridTransporter( {
  auth: {
    // api_user: '', you can use your password and username here
    api_key: "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"
  }

} ) )

exports.getLogin = ( req, res, next ) => {
  console.log( req.flash( 'error' ) )
  res.render( 'auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: false
  } );
};

exports.getSignup = ( req, res, next ) => {

  res.render( 'auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false
  } );
};

exports.postLogin = ( req, res, next ) => {
  const {
    email,
    password
  } = req.body
  User.findOne( {
      email: email
    } )
    .then( user => {
      if ( !user ) {
        req.flash( 'error', 'username or password incorrect' )
        return res.redirect( '/login' )
      }

      bcrypt.compare( password, user.password )
        .then( doMatch => {
          if ( !doMatch ) { //if passwords don't match
            req.flash( 'error', 'passwords don\'t match' )
            return res.redirect( '/login' )
          } else {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save( err => {
              if ( err ) {
                throw err
              }
              res.redirect( '/' )
            } )
          }

        } )
        .catch( error => {
          throw error
        } )
    } )
    .catch( err => console.log( err ) );
};

//user signup
exports.postSignup = ( req, res, next ) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  const errors = validationresult( req );
  if ( !errors.isEmpty() ) {
    res.status( 422 ).render( 'auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      error: errors.array()
    } );
  }


  User.findOne( {
      email: email
    } )
    .then( userDoc => {
      if ( userDoc ) {
        return res.redirect( '/signup' );
      }
      return bcrypt.hash( password, 10 )
        .then( hashedPassword => {
          const user = new User( {
            email: email,
            password: hashedPassword,
            cart: {
              items: []
            }
          } );
          return user.save();
        } )
        .then( result => {
          req.flash( 'success', 'Confirmation link sent to your email' )
          res.redirect( '/login' );
          return transporter.sendMail( {
            to: email,
            from: "georgekinoti254@gmail.com",
            subject: "email verification",
            html: "<p> this is the login link</p>"
          } )
        } )
    } )
    .catch( err => {
      console.log( err );
    } );
};

//logout route
exports.postLogout = ( req, res, next ) => {
  req.session.destroy( err => {
    console.log( err );
    res.redirect( '/' );
  } );
};

//password reset form
exports.resetPassword = ( req, res, next ) => {
  res.render( 'auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    isAuthenticated: false
  } );
};

//receive an email to reset password
exports.postResetPassword = ( req, res, next ) => {
  const email = req.body.email
  crypto.randomBytes( 32, ( err, buffer ) => {
    if ( err ) {
      console.log( 'err in crypto', err );
      return res.redirect( '/reset' )
    }
    const token = buffer.toString( 'hex' );
    User.findOne( {
        email: email
      } )
      .then( user => {
        if ( !user ) {
          req.flash( 'error', 'user with that email isn\'t recognized' )
          return res.redirect( '/reset' )
        }
        user.resetToken = token;
        user.tokenExpiration = Date.now() + 3600000
        return user.save()
      } )
      .then( result => {
        req.flash( 'success', 'check your email for password reset link' )
        res.redirect( '/login' )
        transporter.sendMail( {
          to: email,
          from: "georgekinoti254@gmail.com",
          subject: "email verification",
          html: `
          <p> click the link to reset password <a href="http://localhost:3000/reset/${token}">link</a>
          `
        } )
      } )
      .catch( error => {
        throw err
      } )
  } )

}

//displaying password reset form
exports.getNewPassword = ( req, res, next ) => {
  const token = req.params.token

  User.findOne( {
      resetToken: token,
      tokenExpiration: {
        $gt: Date.now()
      }
    } )
    .then( user => {
      res.render( 'auth/resetpassword', {
        path: '/new-password',
        pageTitle: 'New password',
        userId: user._id,
        passwordToken: token
      } );
    } )
    .catch( ( error ) => {
      throw error
    } )
}

//update the new password
exports.postNewPassword = ( req, res, next ) => {
  const {
    password,
    userId,
    passwordToken
  } = req.body
  console.log( password )
  let resetUser;

  User.findOne( {
      resetToken: passwordToken,
      tokenExpiration: {
        $gt: Date.now()
      },
      _id: userId
    } )
    .then( user => {
      resetUser = user;
      return bcrypt.hash( password, 12 )
    } )
    .then( hashedPassword => {
      resetUser.password = hashedPassword
      resetUser.resetToken = undefined;
      resetUser.tokenExpiration = undefined
      return resetUser.save()

    } )
    .then( () => {
      res.redirect( '/login' )
    } )

    .catch( error => {
      throw error
    } )
}

//auth key: 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
//auth key: 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