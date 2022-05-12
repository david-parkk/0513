const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const passport = require('passport');



dotenv.config();
const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const userRouter = require('./routes/user');
const mapRouter = require('./routes/map');
const { sequelize } = require('./models');
const passportConfig = require('./passport');

const app = express();
passportConfig(); // 패스포트 설정
app.set('port', process.env.PORT || 8001);
app.set('view engine', 'html');
nunjucks.configure('views', {
  express: app,
  watch: true,
});
sequelize.sync({ force: false })
  .then(() => {
    console.log('데이터베이스 연결 성공');
  })
  .catch((err) => {
    console.error(err);
  });
if(process.env.NODE_ENV==="production"){
  app.use(morgan('combined'));
}else{
  app.use(morgan('dev'));
}



//app.use(morgan('dev'));//요청에 관한 정보 콘솔에 기록함
app.use(express.static(path.join(__dirname, 'public')));//정적 파일  제공
app.use('/img', express.static(path.join(__dirname, 'uploads')));//이미지 보여주기
app.use(express.json());//
app.use(express.urlencoded({ extended: false }));//
app.use(cookieParser(process.env.COOKIE_SECRET));
const sessionOption={
  resave:false,
  saveUninitialized:false,
  secret:process.env.COOKIE_SECRET,
  cookie:{
    httpOnly:true,
    secure:false,
  },
};
if(process.env.NODE_ENV==='production'){
  sessionOption.proxy=true;
}


// app.use(session({
//   resave: false,
//   saveUninitialized: false,
//   secret: process.env.COOKIE_SECRET,//cookieParserr과 같은 값이여야 한다
//   cookie: {
//     httpOnly: true,
//     secure: false,
//   },
// }));
app.use(session(sessionOption));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', pageRouter);
app.use('/auth', authRouter);
app.use('/post', postRouter);
app.use('/user', userRouter);
app.use('/map', mapRouter);

app.use((req, res, next) => {
  const error =  new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
