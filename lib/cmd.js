const inquirer = require('inquirer');
const { exec } = require('child_process');



let sourceDir = new Array();


const promptQuestions = [{
        type: 'input',
        name: 'username',
        message: "你的github账户名是什么"
    },
    {
        type: 'input',
        name: 'useremail',
        message: '你的github账户邮箱是什么'
    },
    {
        type: 'input',
        name: 'repo',
        message: '你的github远程仓库名是什么'
    },
    {
        type: 'input',
        name: 'branch',
        message: '你的github仓库分支是什么',
        default () {
            return 'master';
        }
    },
    {
        type: 'input',
        name: 'ignoreDIR',
        message: '需要忽略的文件夹是什么(默认会向下递归处理)，请用","隔开'
    }
]

let config = async() => {
    let answers = await inquirer.prompt(promptQuestions);
    username = answers.username;
    useremail = answers.useremail;
    repo = answers.repo;
    branch = answers.branch;
    ignoreDIR = answers.ignoreDIR.split(',')
    let jsonData = JSON.stringify(answers, null, ' ');
    return jsonData;
}
let execCmd = (cmd) => {
    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            console.log(`无法配置github username: ${stderr}`);
        }
        console.log(`操作: ${stdout}`);
    })
}

let gitConfig = (username, useremail) => {
    execCmd(`git config user.name ${username}`);
    execCmd(`git config user.email ${useremail}`);
    console.log('git config all done..')
}



module.exports = {
    gitConfig: gitConfig,
    config: config
}