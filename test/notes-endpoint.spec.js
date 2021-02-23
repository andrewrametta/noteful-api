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
  describe(`GET /api/notes/:note_id`, () => {
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        const noteId = 123456;
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .expect(404, { error: { message: `Note Not Found` } });
      });
    });

    context("Given there are notes in the database", () => {
      const testNotes = makeNotesArray();

      beforeEach("insert notes", () => {
        return db.into("notes").insert(testNotes);
      });

      it("responds with 200 and the specified note", () => {
        const noteId = 2;
        const expectedNote = testNotes[noteId - 1];
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .expect(200, expectedNote);
      });
    });
  });

  describe("DELETE /api/notes/:note_id", () => {
    context(`Given no folders`, () => {
      it(`responds 404 whe folder doesn't exist`, () => {
        return supertest(app)
          .delete(`/api/notes/123`)
          .expect(404, {
            error: { message: `Note Not Found` },
          });
      });
    });

    context("Given there are folders in the database", () => {
      const testNotes = makeNotesArray();

      beforeEach("insert notes", () => {
        return db.into("notes").insert(testNotes);
      });

      it("removes the note by ID from the store", () => {
        const idToRemove = 2;
        const expectedNotes = testNotes.filter((nt) => nt.id !== idToRemove);
        return supertest(app)
          .delete(`/api/notes/${idToRemove}`)
          .expect(204)
          .then(() => supertest(app).get(`/api/notes`).expect(expectedNotes));
      });
    });
  });
  describe("POST /api/notes", () => {
    it("creates a note, responding with 201 and the new note", () => {
      const newNote = {
        name: "Lions",
        modified: "2018-08-15T17:00:00.000Z",
        folder_id: 1,
        content: "This is a test note. Note about Lions.",
      };
      return supertest(app)
        .post(`/api/notes`)
        .send(newNote)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).to.eql(newNote.name);
          expect(res.body.content).to.eql(newNote.content);
          expect(res.body).to.have.property("id");
          expect(res.headers.location).to.eql(`/notes/${res.body.id}`);
        })
        .then((res) =>
          supertest(app).get(`/api/notes/${res.body.id}`).expect(res.body)
        );
    });
    const requiredFields = ["name", "content"];

    requiredFields.forEach((field) => {
      const newNote = {
        name: "Lions",
        modified: "2018-08-15T17:00:00.000Z",
        folder_id: 1,
        content: "This is a test note. Note about Lions.",
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newNote[field];

        return supertest(app)
          .post("/api/notes")
          .send(newNote)
          .expect(400, {
            error: { message: `'${field}' is required` },
          });
      });
    });
  });
  describe(`PATCH /api/notes/:note_id`, () => {
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        const noteId = 123456;
        return supertest(app)
          .patch(`/api/notes/${noteId}`)
          .expect(404, { error: { message: `Note Not Found` } });
      });
    });
    context("Given there are notes in the database", () => {
      const testNotes = makeNotesArray();

      beforeEach("insert notes", () => {
        return db.into("notes").insert(testNotes);
      });

      it("responds with 204 and updates the folder", () => {
        const idToUpdate = 2;
        const updateNote = {
          name: "updated note name",
        };
        const expectedNote = {
          ...testNotes[idToUpdate - 1],
          ...updateNote,
        };
        return supertest(app)
          .patch(`/api/notes/${idToUpdate}`)
          .send(updateNote)
          .expect(204)
          .then((res) =>
            supertest(app).get(`/api/notes/${idToUpdate}`).expect(expectedNote)
          );
      });

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/notes/${idToUpdate}`)
          .send({ irrelevantField: "foo" })
          .expect(400, {
            error: {
              message:
                "Request body must contain either 'name', 'folder_id', 'content'",
            },
          });
      });

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2;
        const updateNote = {
          name: "updated note name",
        };
        const expectedNote = {
          ...testNotes[idToUpdate - 1],
          ...updateNote,
        };

        return supertest(app)
          .patch(`/api/notes/${idToUpdate}`)
          .send({
            ...updateNote,
            fieldToIgnore: "should not be in GET response",
          })
          .expect(204)
          .then((res) =>
            supertest(app).get(`/api/notes/${idToUpdate}`).expect(expectedNote)
          );
      });
    });
  });
});
