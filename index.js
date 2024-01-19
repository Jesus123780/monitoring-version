const WebSocket = require("ws");
const { Octokit } = require("@octokit/rest");
const fs = require("fs/promises");

require('dotenv').config()

const token = process.env.TOKEN;

const octokit = new Octokit({
  auth: token,
});

const repoOwner = "Jesus123780";
const repoName = "front-client";
const versionFilePath = process.env.PATH_VERSION;

const wsServer = new WebSocket.Server({ port: 8080 });

const readVersionFromFile = async () => {
  try {
    // @ts-ignore
    const fileContent = await fs.readFile(versionFilePath, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    return null;
  }
};

const writeVersionToFile = async (version) => {
  // @ts-ignore
  await fs.writeFile(versionFilePath, JSON.stringify(version, null, 2));
};

wsServer.on("connection", async (socket) => {
  console.log("Cliente conectado");

  const sendCurrentVersion = async () => {
    try {
      const { data } = await octokit.rest.repos.getContent({
        mediaType: {
          format: "raw",
        },
        owner: repoOwner,
        repo: repoName,
        path: "public/version.json",
      });
  
      console.log("Contenido de data:", data);
      
      // Leer la versión actual desde el archivo
      const storedVersion = await readVersionFromFile();
      let lastVersion = storedVersion ? storedVersion : null;
      console.log(lastVersion, storedVersion)
      let currentVersion = data ? JSON.parse(data).version : null
      if (currentVersion === lastVersion) return socket.close();
      // Comparar con la versión actual
      if (currentVersion !== lastVersion) {
        // Guardar la última versión en el archivo
        await writeVersionToFile(currentVersion);
  
        // Enviar la nueva versión al cliente
        socket.send(JSON.stringify({ version: currentVersion }));
      }
    } catch (error) {
      console.log("🚀 ~ sendCurrentVersion ~ error:", error);
      console.error("Error al obtener la última versión:", error.message);
    }
  };
  

  // Enviar la versión actual al cliente cuando se conecta
  await sendCurrentVersion();

  // Verificar si hay una nueva versión cada cierto tiempo
  const intervalId = setInterval(sendCurrentVersion, 60000);

  // Manejar cierre de conexión
  socket.on("close", () => {
    console.log("Cliente desconectado");
    clearInterval(intervalId);
  });
});

console.log("Servidor de WebSocket iniciado en el puerto 8080");
