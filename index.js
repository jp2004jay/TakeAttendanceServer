const mongoose = require('mongoose');
const User = require('./models/UserModel');
const Faculty = require('./models/FacultyModel');
const AttendaceModle = require('./models/AttendaceModle');
require('dotenv').config({path: __dirname + '/.env'})

mongoose.connect(process.env.NODE_APP_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then((response) => {
        const express = require('express');
        const app = express();

        const path = require("path")
        const fileUpload = require('express-fileupload');

        app.use('/images/faculties', express.static('public/files'))

        app.use(express.json());

        app.use(
            fileUpload({
                useTempFiles: true,
                safeFileNames: true,
                preserveExtension: true,
                tempFileDir: `${__dirname}/public/files/temp`
            })
        );

        app.get('/',(req, res)=>{
            res.send("Welcome");
        })

        app.get('/attendace/:id', async (req, res) => {
            const data = await Faculty.findOne({ $and: [{ _id: req.params.id }, { isLogin: 1 }] });
            res.header("Content-Type", "application/json");
            if (data !== null) {
                res.json(data);
            }
            else {
                res.json({ code: 404, messege: "Not Found" });
            }
        })

        app.get('/signout/:email', async (req, res) => {
            await Faculty.findOneAndUpdate({ email: req.params.email }, { isLogin: false });
            res.header("Content-Type", "application/json");
            res.json({ code: 200, messege: "DONE" });
        })

        app.post('/faculty/user/auth', async (req, res) => {
            const userData = await User.findOne({ email: req.body.email });
            const facultyData = await Faculty.findOne({ $and: [{ email: req.body.email }, { contact: req.body.contact }] });
            res.header("Content-Type", "application/json");
            if (userData === null) {
                if (facultyData !== null) {
                    await User.create({
                        email: req.body.email,
                        password: req.body.password
                    })
                    res.json({
                        code: 200,
                        messege: "Registration Successful, Login now"
                    });
                }
                else {
                    res.json({
                        code: 222,
                        messege: "Please contact to our admin because you are not a member of our club"
                    });
                }
            } else {
                res.json({
                    code: 404,
                    messege: "You are already sign up, please login"
                });
            }
        })

        app.options('/login', async (req, res) => {
            const userData = await User.findOne({ $and: [{ email: req.body.email }, { password: req.body.password }] });
            res.header("Content-Type", "application/json");
            if (userData !== null) {
                const faculty = await Faculty.findOneAndUpdate({ email: req.body.email }, { isLogin: true });
                res.json({ id: faculty._id.toString(), code: 200, messege: "Thay gyu" });
            } else {
                res.json({ code: 404, messege: "Please sign up first" });
            }
        })

        app.get('/darshan/admin', async (req, res) => {
            res.json(await Faculty.find({ isAdmin: true }).exec())
        })

        app.post('/attendance/final/submit', async (req, res) => {
            await AttendaceModle.create({
                email: req.body.email,
                department: req.body.department,
                sem: req.body.sem,
                class: req.body.class,
                absentStudents: req.body.absentStudents,
                date: req.body.date
            })
            res.json({ code: 200, messege: "Hogaya" })
        })

        app.options('/attendace/list/get', async (req, res) => {
            const attendaceList = await AttendaceModle.find({ email: req.body.email }).sort({ date: "desc" }).exec()
            res.json({ ...req.body, attendaceList: attendaceList });
        })

        app.options('/attendace/list/get/search', async (req, res) => {
            const attendaceList = await AttendaceModle.find({
                email: req.body.email,
                department: req.body.department,
                sem: req.body.sem,
                class: req.body.class
            }).exec()
            res.json(attendaceList)
        })

        app.get('/attendace/find/via/:id', async (req, res) => {
            res.json(await AttendaceModle.findOne({ _id: req.params.id }))
        })

        app.put('/attendace/find/via/:id', async (req, res) => {
            await AttendaceModle.findOneAndUpdate({ _id: req.params.id }, { absentStudents: req.body.absentStudents });
            res.json(await AttendaceModle.find({ email: req.body.email }).sort({ date: "desc" }).exec())
        })

        app.get('/admin/:adminID/access/faculty', async (req, res) => {
            const admin = await Faculty.findOne({ _id: req.params.adminID, isAdmin: true });
            console.log()
            if (admin !== null) {
                res.json({ faculties: await Faculty.find().sort({ isAdmin: "desc" }), users: await User.find() });
            }
            else {
                await Faculty.findOneAndUpdate({ _id: req.params.adminID }, { isLogin: false });
                res.json({ messege: "You are not admin", code: 404 })
            }
        })

        app.get('/admin/:adminID/access/faculty/:id', async (req, res) => {
            const admin = await Faculty.findOne({ _id: req.params.adminID, isAdmin: true });
            if (admin !== null) {
                const data = await Faculty.findOne({ _id: req.params.id })
                res.json(data ? data : {
                    id: req.params.id,
                    isFound: false,
                    messege: "Faculty does not found"
                });
            }
            else {
                await Faculty.findOneAndUpdate({ _id: req.params.adminID }, { isLogin: false });
                res.send({ messege: "You are not admin", code: 404 })
            }
        })

        app.delete('/admin/:adminID/access/faculty/:id', async (req, res) => {
            const admin = await Faculty.findOne({ _id: req.params.adminID, isAdmin: true });
            const faculty = await Faculty.findOne({ _id: req.params.id });
            if (admin !== null) {
                await Faculty.deleteOne({ _id: req.params.id });
                await User.deleteOne({ email: faculty.email });
                res.json({ faculties: await Faculty.find(), users: await User.find() });
            }
            else {
                await Faculty.findOneAndUpdate({ _id: req.params.adminID }, { isLogin: false });
                res.send({ messege: "You are not admin", code: 404 })
            }
        })

        app.post('/admin/:adminID/access/faculty', async (req, res) => {
            const admin = await Faculty.findOne({ _id: req.params.adminID, isAdmin: true });
            if (admin !== null) {
                const faculty = await Faculty.findOne({ email: req.body.email })
                if (faculty === null) {
                    await Faculty.create({
                        image: req.body.image,
                        name: req.body.name,
                        email: req.body.email,
                        contact: req.body.contact,
                        sitting: req.body.sitting,
                        designation: req.body.designation,
                        education: req.body.education,
                    });
                    res.json({ code: 200, messege: "Thay gyu" });
                }
                else {
                    res.json({ code: 410, messege: "Email Address Already Exiest, You can not entry again." })
                }

            }
            else {
                await Faculty.findOneAndUpdate({ _id: req.params.adminID }, { isLogin: false });
                res.json({ messege: "You are not admin", code: 404 })
            }
        })

        app.post('/admin/:adminID/access/faculty/uplode/:id', async (req, res) => {
            if (req.files !== null) {
                let uploadFile = req.files.file;
                const name = req.params.id;
                const saveAs = name + ".jpg";
                uploadFile.mv(`${__dirname}/public/files/${saveAs}`, function (err) {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    return res.status(200).json({ status: 'uploaded', name, saveAs });
                });
            }
            else {
                res.json({ code: 404, messege: "Please select your image first" });
            }
        });

        app.put('/admin/:adminID/access/faculty/:id', async (req, res) => {
            const admin = await Faculty.findOne({ _id: req.params.adminID, isAdmin: true });
            if (admin !== null) {
                try {
                    await Faculty.findByIdAndUpdate(req.params.id, {
                        image: req.body.image,
                        name: req.body.name,
                        email: req.body.email,
                        contact: req.body.contact,
                        sitting: req.body.sitting,
                        designation: req.body.designation,
                        education: req.body.education,
                    });
                    res.json({ code: 200, messege: "Thay gyu" })
                }
                catch (err) {
                    res.json({ code: 404, messege: err });
                }
            }
            else {
                await Faculty.findOneAndUpdate({ _id: req.params.adminID }, { isLogin: false });
                res.send({ messege: "You are not admin", code: 404 })
            }
        })

        app.listen(8000, () => {
            console.log("App listing at 8000");
        })

    }).catch((error) => {
        console.log(error)
    })