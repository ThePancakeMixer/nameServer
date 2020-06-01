module.exports = {
    ServerConfig: {
        authentication: {
          options: {
            userName: "nikesh96", 
            password: "Factorio23" 
          },
          type: "default"
        },
        server: "nametrackerdb.database.windows.net", 
        options: {
          database: "NameTrackerDB",
          encrypt: true,
          trustServerCertificate: false
        }
      }
}
