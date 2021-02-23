function makeNotesArray() {
  return [
    {
      id: 1,
      name: "Dogs",
      modified: "2018-08-15T17:00:00.000Z",
      folder_id: 1,
      content: "This is a test note. Note number one.",
    },
    {
      id: 2,
      name: "Cats",
      modified: "2018-08-15T17:00:00.000Z",
      folder_id: 2,
      content: "This is a test note. Note number two.",
    },
    {
      id: 3,
      name: "Pigs",
      modified: "2018-08-15T17:00:00.000Z",
      folder_id: 3,
      content: "This is a test note. Note number three.",
    },
  ];
}
module.exports = {
  makeNotesArray,
};
