const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const Path = path;
const { gitConfig, config } = require('./cmd');
const inquirer = require('inquirer');

let targetUrl;
let data;
let dataKey = ['.js', '.css', '.html'];


let fsPathSys = (path, dataKey) => { //遍历路径
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
    ]
    let stat = fs.statSync(path)
    if (stat.isDirectory()) {
        fs.readdir(path, isDirectory)

        function isDirectory(err, files) {
            if (err) {
                console.log(err)
                return err
            } else {
                files.forEach((item, index) => {
                    if (item === '__MACOSX') { //mac无用文件
                        execSync('rm -rf ' + path + '/__MACOSX')
                    } else {
                        let nowPath = `${path}/${item}`
                        let stat = fs.statSync(nowPath)
                        if (!stat.isDirectory()) {
                            dataKey.forEach((obj, index) => {
                                if (~item.indexOf(obj)) {
                                    replaceAddress(nowPath)
                                }
                            })
                        } else {
                            fsPathSys(nowPath, dataKey)
                        }
                    }

                })
            }
        }
    } else {
        dataKey.forEach((obj, index) => {
            replaceAddress(path)
        })
    }
}

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
                                let nowPath = Path.resolve(matchItem).split(`${repo}/`)[1]
                                if (nowPath) {
                                    replaceBody[matchItem] = obj.point + nowPath
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
                        if (nowPath)
                            replaceBody[matchItem] = obj.point + nowPath
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
            itemReplace
        itemReplace = new RegExp(item)
        body = body.replace(itemReplace, replaceBody[i])
    })
    writeFs(path, body)
}

let writeFs = (path, body) => {
    fs.writeFile(path, body, (err) => {
        if (err) throw err;
    })
}

let fsResolve = (path) => {
    fsPathSys(path, dataKey);
};




let tip = async() => {
    let configFile = process.cwd() + '/' + 'rawgitconfig.json'
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
        fs.writeFile(configFile, json, { flag: 'w', encoding: 'utf8' }, (err) => {
            if (err) {
                console.log(err)
            } else {
                console.log('写入配置')
            }
        });

        targetUrl = `https://rawgit.com/${username}/${repo}/${branch}/`;
        gitConfig();
        let json_parse = JSON.parse(json);
        sourceDir = json_parse.sourceDir.split(',');
        sourceDir.forEach((item) => {
            fsResolve(item)
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
                sourceDir = jsonData.sourceDir.split(',');
                targetUrl = `https://rawgit.com/${username}/${repo}/${branch}/`;
                sourceDir.forEach((item) => {
                    fsResolve(item)
                })
            }
        })

    }
}

module.exports = {
    tip: tip
}