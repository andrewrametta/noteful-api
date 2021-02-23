const knex = require("knex");
const supertest = require("supertest");
const app = require("../src/app");
const makeFoldersArray = require("./folders.fixtures");

describe("Folders Endpoints", function () {
  let db;

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL,
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("cleanup", () => db("folders").delete());

  afterEach("cleanup", () => db("folders").delete());

  describe("GET /api/folders", () => {
    context("Given no folders", () => {
      it("response with 200 and an empty list", () => {
        return supertest(app).get("/api/folders").expect(200, []);
      });
    });

    context("Given there are folders in the database", () => {
      const testFolders = makeFoldersArray();

      beforeEach("insert folders", () => {
        return db.into("folders").insert(testFolders);
      });

      it("responds with 200 and all of the folders", () => {
        return supertest(app).get("/api/folders").expect(200, testFolders);
      });
    });
  });

  describe(`GET /api/folders/:folder_id`, () => {
    context(`Given no folders`, () => {
      it(`responds with 404`, () => {
        const folderId = 123456;
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(404, { error: { message: `Folder does not exist` } });
      });
    });

    context("Given there are folders in the database", () => {
      const testFolders = makeFoldersArray();

      beforeEach("insert folders", () => {
        return db.into("folders").insert(testFolders);
      });

      it("responds with 200 and the specified folder", () => {
        const folderId = 2;
        const expectedFolder = testFolders[folderId - 1];
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(200, expectedFolder);
      });
    });
  });

  describe("DELETE /api/folders/:id", () => {
    context(`Given no folders`, () => {
      it(`responds 404 whe folder doesn't exist`, () => {
        return supertest(app)
          .delete(`/api/folders/123`)
          .expect(404, {
            error: { message: `Folder does not exist` },
          });
      });
    });

    context("Given there are folders in the database", () => {
      const testFolders = makeFoldersArray();

      beforeEach("insert folders", () => {
        return db.into("folders").insert(testFolders);
      });

      it("removes the folder by ID from the store", () => {
        const idToRemove = 2;
        const expectedFolders = testFolders.filter(
          (nt) => nt.id !== idToRemove
        );
        return supertest(app)
          .delete(`/api/folders/${idToRemove}`)
          .expect(204)
          .then(() =>
            supertest(app).get(`/api/folders`).expect(expectedFolders)
          );
      });
    });
  });
  describe("POST /api/folders", () => {
    it("creates a folder, responding with 201 and the new folder", () => {
      const newFolder = {
        name: "test-name",
      };
      return supertest(app)
        .post(`/api/folders`)
        .send(newFolder)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).to.eql(newFolder.name);
          expect(res.body).to.have.property("id");
          expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`);
        })
        .then((res) =>
          supertest(app).get(`/api/folders/${res.body.id}`).expect(res.body)
        );
    });
    const requiredFields = ["name"];

    requiredFields.forEach((field) => {
      const newFolder = {
        name: "Test new folder",
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newFolder[field];

        return supertest(app)
          .post("/api/folders")
          .send(newFolder)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` },
          });
      });
    });
  });

  describe(`PATCH /api/folders/:folder_id`, () => {
    context(`Given no folders`, () => {
      it(`responds with 404`, () => {
        const folderId = 123456;
        return supertest(app)
          .patch(`/api/folders/${folderId}`)
          .expect(404, { error: { message: `Folder does not exist` } });
      });
    });
    context("Given there are folders in the database", () => {
      const testFolders = makeFoldersArray();

      beforeEach("insert folders", () => {
        return db.into("folders").insert(testFolders);
      });

      it("responds with 204 and updates the folder", () => {
        const idToUpdate = 2;
        const updateFolder = {
          name: "updated folder name",
        };
        const expectedFolder = {
          ...testFolders[idToUpdate - 1],
          ...updateFolder,
        };
        return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .send(updateFolder)
          .expect(204)
          .then((res) =>
            supertest(app)
              .get(`/api/folders/${idToUpdate}`)
              .expect(expectedFolder)
          );
      });

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .send({ irrelevantField: "foo" })
          .expect(400, {
            error: {
              message: `Request body must contain a name`,
            },
          });
      });

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2;
        const updateFolder = {
          name: "updated folder name",
        };
        const expectedFolder = {
          ...testFolders[idToUpdate - 1],
          ...updateFolder,
        };

        return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .send({
            ...updateFolder,
            fieldToIgnore: "should not be in GET response",
          })
          .expect(204)
          .then((res) =>
            supertest(app)
              .get(`/api/folders/${idToUpdate}`)
              .expect(expectedFolder)
          );
      });
    });
  });
});
