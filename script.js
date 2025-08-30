const TOKEN = "0000000000:XXXXXXXXXXX-YYYYYYYYYYYYYYYYYYYYYYY" //write your bot id here
let mode = 0
let muted = true
let userList = [new Set(), new Set(), new Set()]
const tg_url = "https://api.telegram.org"
const template = `${tg_url}/bot${TOKEN}`
let offset = 0
const allowedContentType = {
    "photo": "img",
    "document": "undefined",
    "video": "video",
    "sticker": "undefined",
    "animation": "undefined",
    "video_note": "video"
}
async function req(url) {
    return await (await (fetch(url))).json()
}
function ElemId(id) {
    return document.getElementById(id)
}
async function clearScreen() {
    return new Promise((resolve) => {
        let viewer = ElemId("viewer")
        if (viewer.childElementCount == 0) {
            resolve()
        }
        while (viewer.childElementCount > 1) {
            viewer.removeChild(viewer.lastChild)
        }
        let content = document.getElementsByClassName("content")[0]
        content.style.animation = "fadeOut 0.5s both"
        content.onanimationend = () => {
            viewer.removeChild(content)
            resolve()
        }
    })
}
async function addContent(path, type) {
    return new Promise(function (resolve, reject) {
        let newContent = document.createElement(type)
        ElemId("viewer").appendChild(newContent)
        newContent.setAttribute("class", "content")
        newContent.setAttribute("src", path)
        if (type == "video") {
            newContent.setAttribute("loop", true)
            newContent.setAttribute("autoplay", true)
            newContent.muted = muted
            newContent.oncanplay = () => {
                newContent.style.animation = "fadeIn 0.5s both"
                newContent.onanimationend = () => {
                    resolve()
                }
            }
        }
        else if (type == "img") {
            newContent.onload = () => {
                newContent.style.animation = "fadeIn 0.5s both"
                newContent.onanimationend = () => {
                    resolve()
                }
            }
        }
        else {
            resolve()
        }
    })
}
async function main() {
    let response = await req(`${template}/getUpdates?offset=${offset}&timeout=1`)
    if (!response["ok"]) {
        console.log("getUpdates response contains ok:false")
        setTimeout(main, 100)
        return
    }
    console.log(response["result"])
    let fileId, type, filePath, username
    for (let key in response["result"]) {
        let update = response["result"][key]
        offset = update["update_id"] + 1
        if (Object.keys(update).indexOf("message") == -1) {
            continue
        }
        let message = update["message"]
        if ((mode == 2 && !userList[2].has(message["from"]["username"])) || (mode == 1 && userList[1].has(message["from"]["username"]))) {
            console.log(message["from"]["username"], 'turned away')
            fetch(`${template}/sendMessage?chat_id=${message["chat"]["id"]}&text=You aren't allowed to use this bot.`)
            continue
        }
        let bufFileId, bufType, bufSize = 0
        for (let contentType in allowedContentType) {
            if (Object.keys(update['message']).indexOf(contentType) == -1)continue
            let object = update["message"][contentType]
            if (contentType == 'photo') {
                bufFileId = object[object.length - 1]['file_id']
                bufSize = object[object.length - 1]['file_size']
            }
            else {
                bufFileId = object['file_id']
                bufSize = object['file_size']
            }
            switch (contentType) {
                case 'document':
                    let mimeType = object['mime_type'].split('/')
                    if (mimeType[1] == 'gif' || mimeType[0] == "image") {
                        bufType = "img"
                    } else if (mimeType[0] == "video") {
                        bufType = "video"
                    }
                    break
                case 'animation':
                    bufType = "img"
                    break
                case 'sticker':
                    if (object["is_video"]) {
                        bufType = "video"
                    } else {
                        bufType = "img"
                    }
                    break
                default:
                    bufType = allowedContentType[contentType]   
            }
            break
        }
        if (bufType == undefined || bufSize>=20*1024*1024) continue
        username = message["from"]["username"]
        type = bufType
        fileId = bufFileId
    }
    if (type == undefined) {
        setTimeout(main, 100)
        return
    }
    console.log(`${username} sent ${type}, fileId=${fileId}`)
    filePath = `${tg_url}/file/bot${TOKEN}/${(await req(`${template}/getFile?file_id=${fileId}`))["result"]["file_path"]}`
    await clearScreen()
    await addContent(filePath, type)
    setTimeout(main, 100)
}
function hideLists() {
    for (let i = 1; i < userList.length; i += 1) {
        ElemId(`userList${i}`).style.display = "none";
    }
}
function addUser(user, listIndex) {
    if (user == "" || listIndex > userList.length || listIndex < 0) {
        return
    }
    if (user[0] == "@") {
        user = user.slice(1)
    }
    if (user == "") {
        return
    }
    let li = document.createElement("div")
    li.innerHTML = user
    function handler(elem) {
        let user = elem.innerHTML
        let cancelId = -1
        function deleteNodeEL(elem) {
            elem.innerHTML = user;
            removeUser(user, mode)
        }
        function cancelEL(e) {
            clearTimeout(cancelId)
            e.currentTarget.innerHTML = user
            e.currentTarget.style.color = "#aaa"
            e.currentTarget.style.animation = "none"
            e.currentTarget.removeEventListener("mouseup", cancelEL)
            e.currentTarget.removeEventListener("mouseleave", cancelEL)
        }
        elem.addEventListener("mousedown", (e) => {
            e.currentTarget.innerHTML = "deleting..."
            e.currentTarget.style.animation = "reddy 0.4s ease-in both"
            e.currentTarget.style.color = "#222"
            e.currentTarget.addEventListener("mouseup", cancelEL, { once: true })
            e.currentTarget.addEventListener("mouseleave", cancelEL, { once: true })
            cancelId = setTimeout(deleteNodeEL, 400, e.currentTarget)
        })
    }
    handler(li)
    if (userList[listIndex].has(user)) {
        return
    }
    userList[listIndex].add(user)
    ElemId(`userList${listIndex}`).appendChild(li)
}
function removeUser(user, listIndex) {
    if (user == "" || listIndex > userList.length || listIndex < 0) {
        return
    }
    if (user[0] == "@") {
        user = user.slice(1)
    }
    if (user == "") {
        return
    }
    userList[listIndex].delete(user)
    for (let c of ElemId(`userList${listIndex}`).children) {
        if (c.innerHTML == user) {
            c.remove()
            break
        }
    }
}
function volumeSwitch(value) {
    if (value == -1) muted = !muted
    else if (value >= 0 && value < 2) muted = (value == 1)
    try {
        document.getElementsByClassName("content")[0].muted = muted
    } catch { }
    if (muted) ElemId("volumeSwitch").innerHTML = "unmute"
    else ElemId("volumeSwitch").innerHTML = "mute"
}
function modeSwitch(value) {
    let modeSwitchStrings = ["allow all", "blocklist", "allowlist"]
    if (value >= 3 || value < -1) {
        return
    }
    if (value == -1) mode += 1
    else mode = value
    if (mode >= 3) mode -= 3
    console.log("set mode to", mode)
    hideLists()
    if (mode == 0) {
        ElemId("userInput").style.display = "none"
    }
    else {
        ElemId("userInput").style.display = "flex"
        if (mode == 1) {
            ElemId("userInput").children[0].placeholder = "add user to blocklist"
        }
        else {
            ElemId("userInput").children[0].placeholder = "add user to allowlist"
        }
        ElemId(`userList${mode}`).style.display = "block"
    }
    ElemId("modeSwitch").innerHTML = modeSwitchStrings[mode]
}
function start() {
    ElemId("startButton").remove()
    main()
}
function formPost(inputValue) {
    addUser(inputValue, mode)
    ElemId('userInput').children[0].value = ''
}
function init() {
    ElemId("volumeSwitch").onclick = () => { volumeSwitch(-1) }
    ElemId("modeSwitch").onclick = () => { modeSwitch(-1) }
    ElemId("clearScreen").onclick = () => { clearScreen() }
    ElemId("startButton").onclick = () => { start() }
    ElemId("userInput").setAttribute("action", "javascript:formPost(ElemId('userInput').children[0].value)")
    for (let i = 1; i < 3; i += 1) {
        let li = document.createElement("div")
        li.className = "list"
        li.id = `userList${i}`
        li.style.display = "none"
        ElemId("userListSection").appendChild(li)
    }
    modeSwitch(mode)
    volumeSwitch(muted)
}
init()
