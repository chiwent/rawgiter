const fs = require('fs');
const path = require('path');
const Path = path;
const { gitConfig, config } = require('./cmd');
const inquirer = require('inquirer');


let fileList = [];

let targetUrl;
let repo;
let data;
let dataKey = ['.js', '.css', '.html'];
let IGNORE_DIR = ['node_modules'];
let IGNORE_EXT = ['.json', '.png', '.jpg', '.jpeg', '.svg', '.txt', '.pdf', '.epub', '.mobi', '.doc', '.docx'];

let isArray = (param) => {
    return Object.prototype.toString.call(param) === '[object Array]';
}

let filterArray = (array) => {
    array = Array.from(new Set(array))
    return array.filter(n => n)
}

let getPathSync = (dir, ignore_dir) => {

    let ignoreDir;
    if (isArray(ignore_dir)) {
        ignore_dir = filterArray(ignore_dir);
        ignoreDir = ignore_dir.concat(IGNORE_DIR);
    } else if (ignore_dir && !isArray(ignore_dir)) {
        ignoreDir = IGNORE_DIR.push(ignore_dir);
    } else if (!ignore_dir) {
        ignoreDir = IGNORE_DIR;
    }

    let dirList = fs.readdirSync(dir);

    dirList.forEach((item) => {
        let currentPath = path.join(dir, item);
        let isFile = fs.statSync(currentPath).isFile();
        let extname = path.extname(item);
        if (isFile && dataKey.indexOf(extname) !== -1) {
            fileList.push(currentPath)
        }
    });
    dirList.forEach((item) => {
        let currentPath = path.join(dir, item);
        let isDirectory = fs.statSync(currentPath).isDirectory();
        if (isDirectory && ignoreDir && ignoreDir.indexOf(item) === -1) {
            getPathSync(currentPath)
        }
    });


    return Array.from(new Set(fileList));
}



let fsPathSys = (path) => {
    data = [{
            'type': 'script',
            'point': targetUrl
        },
        {
            'type': 'link',
            'point': targetUrl
        },
        {
            'type': 'img',
            'point': targetUrl
        },
        {
            'type': 'background',
            'point': targetUrl
        }
    ];
    let replaceAddress = (path) => {
        let readAble = fs.createReadStream(path)
        let body = ''
        readAble.on('data', (chunk) => {
            body += chunk
        })
        readAble.on('end', () => {
            matchData(path, data, body)
        })
    }

    let matchData = (path, data, body) => {
        let replaceBody = {}
        data.forEach((obj, i) => {
            if (obj.type === 'script' || obj.type === 'link' || obj.type === 'img') {
                let bodyMatch = body.match(new RegExp(`<${obj.type}.*?>`, 'g'))
                if (bodyMatch) {
                    bodyMatch.forEach((item, index) => {
                        let itemMatch = item.match(/(src|href)\s*=\s*["|'].*?["|']/g)

                        if (itemMatch) {
                            itemMatch.forEach((item, i) => {
                                let matchItem = item.match(/(["|']).*\/{0,1}$/g)[0].replace(/["|']/g, '').replace(/.+\=['|"]/g, '').replace(/.+["|']/g, '')
                                if (!matchItem.startsWith('http') && !matchItem.startsWith('ftp')) {

                                    let nowPath = Path.resolve(matchItem).split(`${repo}/`)[1];
                                    // console.log('repo:', repo)
                                    if (nowPath) {
                                        nowPath = path.split(`${repo}/`)[1].replace(/[^\/]+$/, '') + nowPath
                                        replaceBody[matchItem] = obj.point + nowPath
                                    } else if (matchItem.startsWith('../')) {
                                        let _path = matchItem.split('../')
                                        let num1 = _path.length - 1;
                                        let num2 = path.split('/').length
                                        replaceBody[matchItem] = obj.point + path.split('/').slice(0, num2 - num1 - 1).join('/').split(`${repo}/`)[1] + '/' + _path.splice(-1, 1)
                                    }
                                }
                            })
                        }
                    })
                }
            } else if (obj.type === 'background' || obj.type === 'background-image') {
                let bodyMatch = body.match(/url\(.*?\)/g)
                if (bodyMatch) {
                    bodyMatch.forEach((item, index) => {
                        let matchItem = item.match(/url\(.*?\)/g)[0].match(/\((.*)\)/g)[0].replace(/[(|)]/g, '')
                        if (!matchItem.startsWith('http') && !matchItem.startsWith('ftp')) {
                            let nowPath = Path.resolve(matchItem).split(`${repo}/`)[1]
                            if (nowPath) {
                                nowPath = path.split(`${repo}/`)[1].replace(/[^\/]+$/, '') + nowPath
                                replaceBody[matchItem] = obj.point + nowPath
                            } else if (matchItem.startsWith('../')) {
                                let _path = matchItem.split('../')
                                let num1 = _path.length - 1;
                                let num2 = path.split('/').length
                                replaceBody[matchItem] = obj.point + path.split('/').slice(0, num2 - num1 - 1).join('/').split(`${repo}/`)[1] + '/' + _path.splice(-1, 1)
                            }
                        }
                    })
                }
            }
        })
        replaceSepical(path, body, replaceBody)
    }

    let replaceSepical = (path, body, replaceBody) => {
        Object.keys(replaceBody).forEach((item, index) => {
            let i = item,
                itemReplace;
            if (item.match(/\.\//g)) {
                item = item.replace(/\.{1,2}/g, '\\\.{1,2}')
            }
            itemReplace = new RegExp(item, 'gm')
            body = body.replace(itemReplace, replaceBody[i])
        })
        writeFs(path, body)
    }

    let writeFs = (path, body) => {
        fs.writeFile(path, body, (err) => {
            if (err) throw err;
        })
    }
    replaceAddress(path);
}


let tip = async() => {
    let ignoreDIR;
    let configFile = process.cwd() + '/' + 'rawgitconfig.json'
    let processingFileList;
    if (!fs.existsSync(configFile)) {
        console.log('首次使用需要修改配置文件，你可以选择自己手动修改或是现在命令行配置，如果不需要以命令行交互配置，请输入q，或者输入除q外任意键进入交互方式配置 \n')
        let question = {
            type: 'input',
            name: 'param',
            message: '请按前面的提示输入',
        }
        let answer = await inquirer.prompt(question);
        if (answer.param === 'q') {
            process.exit()
        } else {
            console.log('现在进入手动配置模式\n')
        }
        let json = await config();
        fs.writeFileSync(configFile, json, { flag: 'w', encoding: 'utf8' }, (err) => {
            if (err) {
                console.log(err)
            } else {
                console.log('写入配置')
            }
        });

        targetUrl = `https://rawgit.com/${username}/${repo}/${branch}/`;

        gitConfig();
        let json_parse = JSON.parse(json);
        ignoreDIR = json_parse.ignoreDIR.split(',');
        repo = json_parse.repo;
        // fatherPath = path.resolve(__dirname, '..');
        let location = process.cwd();
        let processingFileList = getPathSync(location, ignoreDIR); //处理文件
        ignoreDIR.forEach(item1 => {
            processingFileList.forEach(item2 => {
                if (!item2.includes(item1)) {
                    fsPathSys(item2);
                }
            })
        })
    } else {
        fs.readFile(configFile, { flag: 'r', encoding: 'utf8' }, (err, data) => {
            if (err) {
                console.log(err)
            } else {
                if (!data) {
                    console.log('配置文件出错')
                }
                let jsonData = JSON.parse(data);
                username = jsonData.username;
                useremail = jsonData.useremail;
                repo = jsonData.repo;
                branch = jsonData.branch;
                targetUrl = `https://rawgit.com/${username}/${repo}/${branch}/`;
                ignoreDIR = jsonData.ignoreDIR.split(',');
                // fatherPath = path.resolve(__dirname, '..');
                let location = process.cwd();
                let processingFileList = getPathSync(location, ignoreDIR); //处理文件
                processingFileList.forEach(item1 => {
                    ignoreDIR.every(item2 => {
                        if (!item1.includes(item2)) {
                            console.log(item1)
                            fsPathSys(item1)
                        }
                    })
                })
            }
        })

    }
}

module.exports = {
    tip: tip
}