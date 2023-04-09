const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendTradeCreatedNotification = functions.firestore
    .document("trades/{tradeId}")
    .onCreate(async (snap, context) => {
      try {
        const trade = snap.data();

        const userReceiverFcmDoc = await admin
            .firestore()
            .collection("fcmTokens")
            .doc(trade.userReceiver.id)
            .get();

        const token = userReceiverFcmDoc.data().token;

        if (token) {
          const payload = {
            token: token,
            notification: {
              title: "¡Has recibido un nuevo intercambio!",
              body: `${trade.userSender.name} quiere intercambiar contigo
                      una de tus tareas`,
            },
            data: {
              isTradeNotification: "true",
            },
          };

          await admin.messaging().send(payload);
          console.log("Notification sent succesfully");
        }
      } catch (error) {
        console.error(error);
      }
    });

exports.sendTradeAcceptedNotification = functions.firestore
    .document("trades/{tradeId}")
    .onUpdate(async (change, context) => {
      try {
        const trade = change.after.data();
        const tradeBefore = change.before.data();

        if (tradeBefore.status === "pending") {
          const userSenderFcmDoc = await admin
              .firestore()
              .collection("fcmTokens")
              .doc(trade.userSender.id)
              .get();

          const token = userSenderFcmDoc.data().token;

          if (token) {
            const title = trade.status === "accepted" ?
              "¡Tu intercambio ha sido aceptado!" :
              "Tu intercambio ha sido rechazado";

            const body = trade.status === "accepted" ?
              `${trade.userReceiver.name} ha aceptado tu intercambio 🤝🏼` :
              `${trade.userReceiver.name} ha rechazado tu intercambio ❌`;

            const payload = {
              token: token,
              notification: {
                title,
                body,
              },
              data: {
                isTradeNotification: "true",
                isTradeSent: "true",
              },
            };

            await admin.messaging().send(payload);
            console.log("Notification sent succesfully");
          }
        }
      } catch (error) {
        console.error(error);
      }
    });

exports.updateUserRating = functions.firestore
    .document("ratings/{ratingId}")
    .onWrite(async (change, context) => {
      try {
        const rating = change.after.data();

        if (rating == null) {
          return;
        }

        const userRatings = await admin
            .firestore()
            .collection("ratings")
            .where("idUserReceiver", "==", rating.idUserReceiver)
            .get();
        const rateMap = new Map([
          ["work", 0],
          ["communication", 0],
          ["attitude", 0],
          ["overall", 0],
        ]);
        const total = userRatings.size * 5;

        for (const ratingDoc of userRatings.docs) {
          const rating = ratingDoc.data();
          console.log(rating);
          rateMap.set("work", rateMap.get("work") + rating.work);
          rateMap.set("communication", rateMap.get("communication") +
            rating.communication);
          rateMap.set("attitude", rateMap.get("attitude") + rating.attitude);
          rateMap.set("overall", rateMap.get("overall") + rating.overall);
        }

        await admin
            .firestore()
            .collection("users")
            .doc(rating.idUserReceiver)
            .update({
              rating: {
                workRate: (rateMap.get("work") / total) * 0.08,
                communicationRate:
                  (rateMap.get("communication") / total) * 0.08,
                attitudeRate: (rateMap.get("attitude") / total) * 0.08,
                overallRate: (rateMap.get("overall") / total) * 0.16,
              },
            });
      } catch (error) {
        console.error(error);
      }
    });

exports.updateUserQualityMark = functions.firestore
    .document("users/{userId}")
    .onUpdate(async (change, context) => {
      try {
        const user = change.after.data();
        const userBefore = change.before.data();

        if (user == null) {
          return;
        }

        const isRatingUpdated =
        user.rating.workRate !== userBefore.rating.workRate ||
        user.rating.communicationRate !== userBefore.rating.communicationRate ||
        user.rating.attitudeRate !== userBefore.rating.attitudeRate ||
        user.rating.overallRate !== userBefore.rating.overallRate;

        if (
          user.totalTasksAssigned !== userBefore.totalTasksAssigned ||
          user.totalTasksCompleted !== userBefore.totalTasksCompleted ||
          isRatingUpdated
        ) {
          console.log("Efficiency (before): ", user.efficiency);
          const efficiency = user.totalTasksCompleted / user.totalTasksAssigned;
          console.log("Efficiency (after): ", efficiency);

          const qualityMark =
            user.rating.workRate +
            user.rating.communicationRate +
            user.rating.attitudeRate +
            user.rating.overallRate +
            efficiency * 0.6;

          await admin
              .firestore()
              .collection("users")
              .doc(user.id)
              .update({
                qualityMark,
                efficiency,
              });
        }
      } catch (error) {
        console.error(error);
      }
    });
