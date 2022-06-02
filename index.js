const express = require ('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('express-flash');

const db = require('./connection/db')
const upload = require('./middlewares/uploadFile');

const pg = require('pg');

const app = express();
const port = 4500;

const isLogin = true;
let projects = [
    {
        title: 'Photo Studio',
        startDate: '2022-05-24',
        endDate: '2022-06-24',
        duration: '1 Months',
        description: 'Photo Editors are in charge of coordinating photo assignments by selecting, editing, and positioning photos, and publishing images in print publications and on the web.',
        html: 'public/html.png',
        css: 'public/css.png',
        javascript: 'public/javascript.png',
        react: 'public/react.png',
        image: '1.webp',
        date : '24 May 2022 - 24 June 2022'
    },
];

// TEST CONNECTION DB
db.connect(function(err, _, done){
  if (err) throw err;

  console.log('Database Connection Success');
});
 
// PORT
app.listen(port, function () {
    console.log(`Server running on port: ${port}`);
});

// VIEW ENGINE
app.set('view engine', 'hbs');

app.use('/public', express.static(__dirname + '/public'));

app.use('/uploads', express.static(__dirname + '/uploads'));

app.use(express.urlencoded({ extended: false }));

pg.types.setTypeParser(1082, function(stringValue) {
  return stringValue; });

app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 2 },
  })
);

app.use(flash());

// ROUTING
app.get('/', function (req, res) {
    db.connect(function(err, client, done) {
      if (err) throw err;
    
      let query = '';

      if (req.session.isLogin == true) {
        query = `SELECT tb_project.*, tb_user.id as "user_id", tb_user.name, tb_user.email
        FROM tb_project
        LEFT JOIN tb_user
        ON tb_project.author_id = tb_user.id 
        WHERE tb_project.author_id = ${req.session.user.id}
        ORDER BY tb_project.id DESC`;
      } else {
        query = `SELECT tb_project.*, tb_user.id as "user_id", tb_user.name, tb_user.email
        FROM tb_project
        LEFT JOIN tb_user
        ON tb_project.author_id = tb_user.id
        ORDER BY tb_project.id DESC`;
      }
    client.query(query, function (err, result){
      if (err) throw err;

    const projectsData = result.rows;

    const newProject = projectsData.map((project) => {
    project.isLogin = req.session.isLogin;
    project.duration = difference(project["startDate"], project["endDate"]);
    project.date = getFullTime(project["startDate"], project["startDate"]);
    project.name = project.name ? project.name : 'Unknown';
    project.image = project.image ? '/uploads/' + project.image: '/public/1.webp';

      return project;
    });

    console.log(newProject);

    res.render('index', {isLogin: req.session.isLogin, projects: newProject, user: req.session.user});
    });

    done();
  });
});

app.get('/home', function (req, res){
    db.connect(function(err, client, done) {
      if (err) throw err;
    
      let query = '';

      if (req.session.isLogin == true) {
        query = `SELECT tb_project.*, tb_user.id as "user_id", tb_user.name, tb_user.email
        FROM tb_project
        LEFT JOIN tb_user
        ON tb_project.author_id = tb_user.id 
        WHERE tb_project.author_id = ${req.session.user.id}
        ORDER BY tb_project.id DESC`;
      } else {
        query = `SELECT tb_project.*, tb_user.id as "user_id", tb_user.name, tb_user.email
        FROM tb_project
        LEFT JOIN tb_user
        ON tb_project.author_id = tb_user.id
        ORDER BY tb_project.id DESC`;
      }
    client.query(query, function (err, result){
      if (err) throw err;

    const projectsData = result.rows;

    const newProject = projectsData.map((project) => {
    project.isLogin = req.session.isLogin;
    project.duration = difference(project["startDate"], project["endDate"]);
    project.date = getFullTime(project["startDate"], project["startDate"]);
    project.name = project.name ? project.name : 'Unknown';
    project.image = project.image ? '/uploads/' + project.image: '/public/1.webp';
    
      return project;
    });

    console.log(newProject);

    res.render('index', {isLogin: req.session.isLogin, projects: newProject, user: req.session.user});
    });

    done();
  });
});


app.get('/add-project', function (req, res){
  const isLogin = req.session.isLogin
    res.render('add-project', {isLogin, user: req.session.user});
});

app.post('/add-project', upload.single('image'), function (req, res){
    const data = req.body;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const userId = req.session.user.id;
    const fileName = req.file.filename;

    
    if (startDate == '') {
      req.flash('warning', 'Please input start date');
      return res.redirect('/add-project');
    }

    if (endDate == '') {
      req.flash('warning', 'Please input end date');
      return res.redirect('/add-project');
    }

    if (data.description == '') {
      req.flash('warning', 'Please write description of project');
      return res.redirect('/add-project');
    }

    if (data.image == '') {
      req.flash('warning', 'Please choose an image of project');
      return res.redirect('/add-project');
    }

    if (data.title == '') {
      req.flash('warning', 'Please input the title of project');
      return res.redirect('/add-project');
    }

    console.log(data);

    db.connect(function(err, client, done) {
    if (err) throw err;
  
    const query = `INSERT INTO tb_project("startDate", "endDate", description, html, css, javascript, react, image, title, author_id)
                   VALUES ('${startDate}', '${endDate}', '${data.description}', '${data.html}', '${data.css}', '${data.javascript}', '${data.react}', '${fileName}', '${data.title}', ${userId})`;

    client.query(query, function (err, result) {
    if (err) throw err;
  
    req.flash('success', `Successfully added new project! <b>${data.title}</b>`);

    res.redirect('/');
    });

    done();
  });
});

app.get('/project-detail/:id', function (req, res){
  const id = req.params.id;
  const isLogin = req.session.isLogin

  db.connect(function(err, client, done) {
    if (err) throw err;
  
    const query = `SELECT tb_project.*, tb_user.id as "user_id", tb_user.name, tb_user.email
                    FROM tb_project
                    LEFT JOIN tb_user
                    ON tb_project.author_id = tb_user.id
                    WHERE tb_project.id = ${id}`;

  client.query(query, function (err, result){
    if (err) throw err;
    
    const project = result.rows[0];
    const detail = project;  

    detail.duration = difference(detail["startDate"], detail["endDate"]);
    detail.date = getFullTime(detail["startDate"], detail["startDate"]);
    detail.name = project.name ? project.name : 'Unknown';
    detail.image = project.image ? '/uploads/' + project.image: '/public/1.webp';

    res.render('project-detail', {isLogin, detail: detail, user: req.session.user})
    });
    done();
  });
})

app.get('/contact', function(req, res){
  const isLogin = req.session.isLogin
    res.render('contact', {isLogin, user: req.session.user});
});

app.get('/login', function(req, res){
  const isLogin = req.session.isLogin
    res.render('login', {isLogin, user: req.session.user});
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (email == '' || password == '') {
    req.flash('warning', 'Please insert all fields');
    return res.redirect('/login');
  }

  db.connect(function (err, client, done) {
    if (err) throw err;

    const query = `SELECT * FROM tb_user WHERE email = '${email}';`;

    client.query(query, function (err, result) {
      if (err) throw err;

      const data = result.rows;

      if (data.length == 0) {
        req.flash('error', 'Email not found');
        return res.redirect('/login');
      }

      const isMatch = bcrypt.compareSync(password, data[0].password);

      if (isMatch == false) {
        req.flash('error', 'Password not match');
        return res.redirect('/login');
      }

      req.session.isLogin = true;
      req.session.user = {
        id: data[0].id,
        email: data[0].email,
        name: data[0].name,
      };

      req.flash('success', `Welcome, <b>${data[0].name} (${data[0].email})</b>`);

      res.redirect('/');
    });

    done();
  });
});

app.get('/register', function(req, res){
  const isLogin = req.session.isLogin
    res.render('register', {isLogin, user: req.session.user});
});

app.post('/register', (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  let password = req.body.password;

  password = bcrypt.hashSync(password, 10);

  db.connect(function (err, client, done) {
    if (err) throw err;

    const query = `INSERT INTO tb_user(name,email,password) 
                    VALUES('${name}','${email}','${password}');`;

    client.query(query, function (err, result) {
      if (err) throw err;

      if (err) {
        res.redirect('/register');
      } else {
        req.flash('success', 'Your account successfully added, please login to continue.');
        res.redirect('/login');
      }
    });

    if (name== '' || email == '' || password == '') {
      req.flash('warning', 'All fields must be filled');
      return res.redirect('/register');
    }

    done();
  });
});

app.get('/edit-project/:id', function(req, res){
    let id = req.params.id;
    const isLogin = req.session.isLogin
    
    db.connect(function(err, client, done) {
      if (err) throw err;
    
    const query = `SELECT * FROM tb_project WHERE id = ${id}`;

    client.query(query, function (err, result){
      if (err) throw err;

    const project = result.rows[0];
    const edit = project;

    edit.image = project.image ? '/uploads/' + project.image: '/public/1.webp';

    res.render('edit-project', {isLogin, edit, id, user: req.session.user})
    });
    done();
  });
});

app.post('/edit-project/:id', upload.single('image'), function(req, res){
    const data = req.body;
    const id = req.params.id;
    

    projects[id]=data;

    if (data.startDate == '') {
      req.flash('warning', 'Please input start date');
      return res.redirect(`/edit-project/${id}`);
    }

    if (data.endDate == '') {
      req.flash('warning', 'Please input end date');
      return res.redirect(`/edit-project/${id}`);
    }

    if (data.description == '') {
      req.flash('warning', 'Please write description of project');
      return res.redirect(`/edit-project/${id}`);
    }

    if (data.image == '') {
      req.flash('warning', 'Please choose an image of project');
      return res.redirect(`/edit-project/${id}`);
    }

    if (data.title == '') {
      req.flash('warning', 'Please input the title of project');
      return res.redirect(`/edit-project/${id}`);
    }

    db.connect(function(err, client, done) {
      if (err) throw err;
    
      const query = `UPDATE tb_project
                     SET "startDate" = '${data.startDate}', "endDate" = '${data.endDate}', description = '${data.description}', 
                     html = '${data.html}', css = '${data.css}', javascript = '${data.javascript}', react = '${data.react}', 
                     image = '${data.image}', title = '${data.title}'
                     WHERE id = ${id}`;
  
      client.query(query, function (err, result) {
      if (err) throw err;
    
      req.flash('success', `Successfully edited existing project, <b>${data.title}</b>`);

      res.redirect('/');
      });
  
      done();
    });
  });

app.get('/delete-project/:id', (req, res) => {
    const id = req.params.id;
   
    db.connect(function(err, client, done) {
      if (err) throw err;
    
      const query = `DELETE FROM tb_project WHERE id = ${id}`;
  
      client.query(query, function (err, result) {
      if (err) throw err;
    
      res.redirect('/');
      });
  
      done();
    });
  });

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// TIME

const month = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  
  // DURATION DATE
  function getFullTime(startDate,endDate){
    startDate = new Date(startDate);
    endDate = new Date(endDate);
    return `${startDate.getDate()} ${month[startDate.getMonth()]} ${startDate.getFullYear()} - ${endDate.getDate()} ${month[endDate.getMonth()]} ${endDate.getFullYear()}`;
  }

  // DURATION TIME
  function difference(date1, date2) {
    date1 = new Date(date1);
    date2 = new Date(date2);
    const date1utc = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const date2utc = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
      day = 1000*60*60*24;
      dif =(date2utc - date1utc)/day;
    return dif < 30 ? dif +" Days" : parseInt(dif/30)+" Months"
  }
  
  
