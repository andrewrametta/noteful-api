const knex = require("knex");
const { makeNotesArray } = require("./notes.fixtures");
const makeFoldersArray = require("./folders.fixtures");
const app = require("../src/app");
const supertest = require("supertest");

describe("Notes Endpoints", () => {
  let db;

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL,
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("cleanup", () => db("notes").delete());

  afterEach("cleanup", () => db("notes").delete());

  describe(`GET /api/notes`, () => {
    context(`Given no Notes`, () => {
      it(`response with 200 and an empty list`, () => {
        return supertest(app).get("/api/notes").expect(200, []);
      });
    });

    context("Given there are notes in the database", () => {
      const testNotes = makeNotesArray();
      const testFolders = makeFoldersArray();

      beforeEach("insert notes", () => {
        return db
          .into("folders")
          .insert(testFolders)
          .then(() => {
            return db.into("notes").insert(testNotes);
          });
      });

      it("responds with 200 and all of the notes", () => {
        return supertest(app).get("/api/notes").expect(200, testNotes);
      });
    });
  });
});
