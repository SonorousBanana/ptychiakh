const axios = require("axios");
const admin = require("firebase-admin");
const functions = require("firebase-functions");

admin.initializeApp();
const database = admin.firestore();
const communityCollection = database.collection("Community");

communityCollection.get()
    .then((querySnapshot) => {
      querySnapshot.forEach((communityDoc) => {
        const usersCollection = communityDoc.ref.collection("Community");
        usersCollection.get()
            .then((userQuerySnapshot) => {
              userQuerySnapshot.forEach((userDoc) => {
                // const userId = userDoc.id;
                const userData = userDoc.data();
                const userLocation = userData.location;

                axios.post(
                    "https://us-central1-firebaseauth.cloudfunctions.net/deleteInactiveUsers",
                    {
                      location: userLocation,
                    },
                )
                    .then((response) => {
                      console.log("Inactive users", response.data);
                    })
                    .catch((error) => {
                      console.error("Error deleting", error);
                    });
              });
            })
            .catch((error) => {
              console.error("Error fetching user data:", error);
            });
      });
    })
    .catch((error) => {
      console.error("Error fetching community data:", error);
    });

exports.deleteInactiveUsers = functions.https.onRequest(async (req, res) => {
  try {
    const { location } = req.body;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const q = database.firestore().collection("Community")
        .doc(location).collection("users")
        .where("createdAt", "<", weekAgo);

    const inactiveUsersSnapshot = await q.get();

    inactiveUsersSnapshot.forEach(async (userDoc) => {
      const userId = userDoc.id;

      await database.collection("Community").doc(location).collection("users")
          .doc(userId)
          .delete();
    });
    return res.status(200).send("Inactive users deleted successfully.");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Error deleting inactive users.");
  }
});

exports.deleteInactiveEvents = functions.https.onRequest(async (req, res) => {
  try {
    const { location } = req.body;
    const date = new Date();
    const dateString = date.toISOString().split("T")[0];
    const q = database.firestore().collection("Community").doc(location)
        .collection("event")
        .where("date", "<", dateString);

    const inactiveEventsSnapshot = await q.get();

    inactiveEventsSnapshot.forEach(async (eventDoc) => {
      const eventId = eventDoc.id;

      await database.collection("Community").doc(location)
          .collection("event").doc(eventId)
          .delete();
    });
    return res.status(200).send("Inactive events deleted successfully.");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Error deleting inactive events.");
  }
});
