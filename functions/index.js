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
              `${trade.userReceiver.name} ha rechazado tu intercambio`;

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
