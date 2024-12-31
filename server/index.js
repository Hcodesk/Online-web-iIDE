const server = require('http').createServer() //on importe le module http de node js avec la fuction pour créer des serveur
const pty = require('node-pty') //pour créer des processus pseudo-teminaux
const os = require ('os') //module qui fournit des functions pour interagir avec le Os
const shell = os.platform() === 'win32' ? 'cmd.exe' : 'bash'
const { Server : SocketServer} = require('socket.io') //on importe la classe Server qu'on renomme en socketserver
const io = new SocketServer({
    cors : "*" //ce paramettre permet a toutes les origines de se connecter au serversocket
}) //on crée une instance du serversocket
const express = require ('express')
const fs = require('fs/promises')

const ptyprocess = pty.spawn(shell,[], {
    name: 'xterm-color', //type de terminal
    cols: 80, //colonnes du terminal
    rows: 30, //lignes du terminal
    cwd: process.env.INIT_CWD + '/user', //repertoire de travail initial du processus pty
    env: process.env
} ) //crée un nouveau processus pty qui exécute le shell cmd

const app = express()
app.use(cors()) //utilise le middleware cors pour permettre aux ressources d'être démandé a partir d'autre domaine que celui du serveur
io.attach(server) // attache le serveur http au socketserver pour gérer les connexion websocket sur le serveur http

ptyprocess.onData(data => {
    io.emit('terminal:data', data) //on soumet les données au socketserver
}) //chaque fois que le processus pty génère des données , elles sont envoyés au socketserver



io.on('connection', (socket) => {
    console.log('socket connected', socket.id)

    socket.emit ('file:refresh') //envoi d'un event au client pour lui indiquer de rafraichir les files

    socket.on('file:change', async ({path, content}) => {
        fstat.writeFile(`./user${path}`, content)
    }) //écoute l'event file:change envoyé par le client, après réception le serveur écrit le contenu dans le fichier spécifié

    socket.on('terminal:write', (data) => {
        console.log('term', data)
        ptyprocess.write(data)
    }) //récupère les données du client via websoket et les transmettre au terminal pour exécution
    
}) //écoute les nouvelles connexions websocket

async function generateFileTree (directory) {
    const tree = {}

     async function buildTree (currentDir, currentTree) {
        const files = await fs.readdir(currentDir)

        for(const file of files) {
            const filePath = path.join(currentDir, file)
            const stat = await fs.stat(filePath)

            if(stat.isDirectory()) {
                currentTree[file] = {}
                buildTree(filePath, currentTree[file] )
            } else {
                currentTree[file] = null
            }
        }
     }


     await buildTree(directory, tree)
}

app.get('/files', async (req, res) => {
    const fileTree = await generateFileTree('./user');
    return res.json({ tree: fileTree })
})

app.get('/files/content', async (req, res) => {
    const path = req.query.path;
    const content = await fs.readFile(`./user${path}`, 'utf-8')
    return res.json({ content })
})


server.listen(9000, () => console.log('docker server running in port 9000'))