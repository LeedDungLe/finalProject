const express = require('express');
const hbs = require('express-handlebars');
const bodyParser = require("body-parser");
const app = express();
const con = require('./models/taskModel');
var Handlebars = require('handlebars');

app.use(express.static('public'));
app.engine('hbs', hbs.engine({
    layoutsDir: __dirname + '/views/layouts',
    defaultLayout: 'main',
    extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.render('index', {});
});

Handlebars.registerHelper("inc", function(value, options) {
    return parseInt(value) + 1;
});


app.post('/', (req, res) => {
    let query = "SELECT * FROM coursedata WHERE maHocPhan = ?";
    data = [
        req.body.task_id
    ]
    con.query(query, [data], (err, result) => {
        if (err) throw err;
        if (result.length === 0) {
            res.render('index', {
                isExist: false,
                showDetail: true
            });
        } else {
            var insertQuery = "INSERT INTO searchcount (maHocPhan, userAgent) VALUES (?,?)";
            con.query(insertQuery, [req.body.task_id, req.headers['user-agent']], function(err, result) {
                if (err) throw err;
                console.log(result);
            });
            let countQuery = "SELECT COUNT(*) as count FROM coursedata where hocPhanDieuKien like ?";
            con.query(countQuery, '%' + [req.body.task_id] + '%', (err, countDep) => {
                if (err) throw err;
                urlImg = "http://sinno.soict.ai:37080/course?id=" + req.body.task_id
                    // urlImg = "http://localhost:80/course?id=" + req.body.task_id
                    // Nếu không có yêu cầu học phần điều kiện
                if (result[0].hocPhanDieuKien.trim() == '') {
                    res.render('index', {
                        isExist: true,
                        showDetail: true,
                        moduleCode: result[0].maHocPhan,
                        moduleName: result[0].tenHocPhan,
                        Duration: result[0].thoiLuong,
                        NumberOfCredits: result[0].soTinChi,
                        TCTuitionFees: result[0].tinChiHocPhi,
                        Weighting: result[0].trongSo,
                        FactorManagementInstitute: result[0].vienQuanLy,
                        goal: result[0].mucTieu,
                        content: result[0].noiDung,
                        conditonModule: result[0].hocPhanDieuKien,
                        srcText: urlImg,
                        needPreCondition: false,
                        countDep: countDep[0].count
                    });
                }
                // Với trường hợp có yêu cầu các học phần điều kiện
                else {
                    var spawn = require('child_process').spawn;
                    var process2 = spawn('python', [
                        './calc.py', req.body.task_id
                    ]);
                    process2.stdout.on('data', function(data1) {
                        data1 = data1.toString().replace(/(\r\n|\n|\r)/gm, "");
                        hasSubImage = true
                        if (data1 == "stop") {
                            hasSubImage = false
                        }
                        var process = spawn('python', [
                            './script.py', result[0].hocPhanDieuKien
                        ]);
                        process.stdout.on('data', function(data) {
                            // giá trị từ phía python trả về dưới dạng buffer, chuyển đổi sang dạng dữ liệu có thể dùng được
                            data = data.toString().replace(/(\r\n|\n|\r)/gm, "");
                            data = eval(`(${data})`);
                            console.log(data)
                                // Nếu không có học phần bắt buộc
                            if (data.preCourseLst.length == 0 &&
                                data.prerequite.length == 0 &&
                                data.corequisite.length == 0) {
                                res.render('index', {
                                    isExist: true,
                                    showDetail: true,
                                    moduleCode: result[0].maHocPhan,
                                    moduleName: result[0].tenHocPhan,
                                    Duration: result[0].thoiLuong,
                                    NumberOfCredits: result[0].soTinChi,
                                    TCTuitionFees: result[0].tinChiHocPhi,
                                    Weighting: result[0].trongSo,
                                    FactorManagementInstitute: result[0].vienQuanLy,
                                    goal: result[0].mucTieu,
                                    content: result[0].noiDung,
                                    conditonModule: result[0].hocPhanDieuKien,
                                    srcText: urlImg,
                                    isRequire: false,
                                    needPreCondition: true,
                                    hasSubImage: hasSubImage,
                                    filePath: data1,
                                    countDep: countDep[0].count
                                });
                            } else {
                                res.render('index', {
                                    isExist: true,
                                    showDetail: true,
                                    moduleCode: result[0].maHocPhan,
                                    moduleName: result[0].tenHocPhan,
                                    Duration: result[0].thoiLuong,
                                    NumberOfCredits: result[0].soTinChi,
                                    TCTuitionFees: result[0].tinChiHocPhi,
                                    Weighting: result[0].trongSo,
                                    FactorManagementInstitute: result[0].vienQuanLy,
                                    goal: result[0].mucTieu,
                                    content: result[0].noiDung,
                                    conditonModule: result[0].hocPhanDieuKien,
                                    srcText: urlImg,
                                    isRequire: true,
                                    requirement: data,
                                    needPreCondition: true,
                                    hasSubImage: hasSubImage,
                                    filePath: data1,
                                    countDep: countDep[0].count
                                });
                            }
                        });
                    })
                }


            })
        }
    })
})

app.get('/:task_id', (req, res) => {
    let query = "SELECT * FROM coursedata WHERE maHocPhan = ?";
    data = [
        req.params.task_id
    ]
    con.query(query, [data], (err, result) => {
        if (err) throw err;
        if (result.length === 0) {
            res.render('index', {
                isExist: false,
                showDetail: true
            });
        } else {
            urlImg = "http://sinno.soict.ai:37080/course?id=" + req.params.task_id
                // urlImg = "http://localhost:80/course?id=" + req.params.task_id
                // Nếu không có yêu cầu học phần điều kiện
            if (result[0].hocPhanDieuKien.trim() == '') {
                res.render('index', {
                    isExist: true,
                    showDetail: true,
                    moduleCode: result[0].maHocPhan,
                    moduleName: result[0].tenHocPhan,
                    Duration: result[0].thoiLuong,
                    NumberOfCredits: result[0].soTinChi,
                    TCTuitionFees: result[0].tinChiHocPhi,
                    Weighting: result[0].trongSo,
                    FactorManagementInstitute: result[0].vienQuanLy,
                    goal: result[0].mucTieu,
                    content: result[0].noiDung,
                    conditonModule: result[0].hocPhanDieuKien,
                    srcText: urlImg,
                    needPreCondition: false
                });
            }
            // Với trường hợp có yêu cầu các học phần điều kiện
            else {
                var spawn = require('child_process').spawn;
                var process = spawn('python', [
                    './script.py', result[0].hocPhanDieuKien
                ]);
                process.stdout.on('data', function(data) {
                    // giá trị từ phía python trả về dưới dạng buffer, chuyển đổi sang dạng dữ liệu có thể dùng được
                    data = data.toString().replace(/(\r\n|\n|\r)/gm, "");
                    data = eval(`(${data})`);
                    console.log(data)
                        // Nếu không có học phần bắt buộc
                    if (data.preCourseLst.length == 0 &&
                        data.prerequite.length == 0 &&
                        data.corequisite.length == 0) {
                        res.render('index', {
                            isExist: true,
                            showDetail: true,
                            moduleCode: result[0].maHocPhan,
                            moduleName: result[0].tenHocPhan,
                            Duration: result[0].thoiLuong,
                            NumberOfCredits: result[0].soTinChi,
                            TCTuitionFees: result[0].tinChiHocPhi,
                            Weighting: result[0].trongSo,
                            FactorManagementInstitute: result[0].vienQuanLy,
                            goal: result[0].mucTieu,
                            content: result[0].noiDung,
                            conditonModule: result[0].hocPhanDieuKien,
                            srcText: urlImg,
                            isRequire: false,
                            needPreCondition: true
                        });
                    } else {
                        res.render('index', {
                            isExist: true,
                            showDetail: true,
                            moduleCode: result[0].maHocPhan,
                            moduleName: result[0].tenHocPhan,
                            conditonModule: result[0].hocPhanDieuKien,
                            srcText: urlImg,
                            isRequire: true,
                            requirement: data,
                            needPreCondition: true
                        });
                    }
                });
            }



        }
    })
})

app.post('/test', (req, res) => {
    console.log(req.body)
    res.status(200).send("success");
});

// port where app is served
app.listen(70, () => {
    console.log('The web server has started on port 70');
});