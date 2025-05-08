const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Chat API Documentation",
      version: "1.0.0",
      description: "API documentation for the chat application",
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:3000",
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const userOptions = {
  ...options,
  definition: {
    ...options.definition,
    info: {
      ...options.definition.info,
      title: "User API Documentation",
    },
  },
  apis: [
    "./src/routes/authRoutes.js",
    "./src/routes/userRoutes.js",
    "./src/routes/messageRoutes.js",
    "./src/routes/groupRoutes.js",
  ],
};

const adminOptions = {
  ...options,
  definition: {
    ...options.definition,
    info: {
      ...options.definition.info,
      title: "Admin API Documentation",
    },
  },
};

const userSpecs = swaggerJsDoc(userOptions);
const adminSpecs = swaggerJsDoc(adminOptions);

let docsOption = { explorer: true };

let adminSwaggerDocs = swaggerUi.generateHTML(adminSpecs, docsOption);
let userSwaggerDocs = swaggerUi.generateHTML(userSpecs, docsOption);

module.exports = (app) => {
  app.use("/api/docs/admin", swaggerUi.serveFiles(adminSpecs, docsOption));
  app.get("/api/docs/admin", (req, res) => res.send(adminSwaggerDocs));
  app.use("/api/docs/user", swaggerUi.serveFiles(userSpecs, docsOption));
  app.get("/api/docs/user", (req, res) => res.send(userSwaggerDocs));
};
