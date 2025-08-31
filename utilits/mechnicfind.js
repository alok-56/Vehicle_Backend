// const Bookingsmodel = require("../models/booking.model");
// const Mechanicmodel = require("../models/mechanic.model");
// const APPLICATION_CONSTANT = require("../constant/application_constant");
// const { getIO } = require("../utilits/socket");

// const MAX_DISTANCE_KM = 20;
// const RESPONSE_TIMEOUT_MS = 15000;
// const MAX_RETRY_DURATION_MS = 2 * 60 * 1000;
// const MAX_ACTIVE_TIMERS = 500;

// const bookingTimers = new Map();

// const startMechanicMatching = async (
//   bookingId,
//   bookingdata,
//   lat,
//   lng,
//   vehicletype,
//   radiusKm = 1,
//   totalTimeElapsed = 0
// ) => {
//   const booking = await Bookingsmodel.findById(bookingId);
//   if (!booking || booking.status !== APPLICATION_CONSTANT.PENDING) return;

//   if (bookingTimers.size >= MAX_ACTIVE_TIMERS) {
//     return getIO().to(booking.userid.toString()).emit("bookingFailed", {
//       message: "System is currently busy. Please try again shortly.",
//     });
//   }

//   const mechanics = await Mechanicmodel.find({
//     isAvailable: true,
//     vehicle_type: { $in: vehicletype },
//     _id: { $nin: booking.triedMechanicIds },
//     // location: {
//     //   $near: {
//     //     $geometry: { type: "Point", coordinates: [lng, lat] },
//     //     $maxDistance: radiusKm * 1000,
//     //   },
//     // },
//   });

//   if (!mechanics.length) {
//     if (radiusKm < MAX_DISTANCE_KM) {
//       return startMechanicMatching(
//         bookingId,
//         lat,
//         lng,
//         radiusKm + 1,
//         totalTimeElapsed
//       );
//     } else {
//       getIO().to(booking.userid.toString()).emit("bookingFailed", {
//         message: "No mechanics available within 10 km. Please try again later.",
//       });
//       return;
//     }
//   }

//   const mechanic = await selectBestMechanic(mechanics);
//   booking.triedMechanicIds.push(mechanic._id);
//   await booking.save();

//   getIO().to(mechanic.socketId).emit("newBookingRequest", {
//     bookingId: booking._id,
//     userLocation: booking.userLocation.coordinates,
//     problem: booking.problem,
//     bookingdata: bookingdata,
//   });

//   if (bookingTimers.has(bookingId)) {
//     clearTimeout(bookingTimers.get(bookingId));
//   }

//   const timer = setTimeout(async () => {
//     const updatedBooking = await Bookingsmodel.findById(bookingId);
//     if (
//       updatedBooking &&
//       updatedBooking.status === APPLICATION_CONSTANT.PENDING
//     ) {
//       const newElapsed = totalTimeElapsed + RESPONSE_TIMEOUT_MS;

//       if (newElapsed >= MAX_RETRY_DURATION_MS) {
//         updatedBooking.status = APPLICATION_CONSTANT.EXPIRED;
//         await updatedBooking.save();

//         getIO().to(updatedBooking.userid.toString()).emit("bookingFailed", {
//           message: "Booking expired. No mechanic accepted in time.",
//         });
//       } else {
//         startMechanicMatching(bookingId, lat, lng, radiusKm + 1, newElapsed);
//       }
//     }

//     bookingTimers.delete(bookingId);
//   }, RESPONSE_TIMEOUT_MS);

//   bookingTimers.set(bookingId, timer);
// };

const Bookingsmodel = require("../models/booking.model");
const Mechanicmodel = require("../models/mechanic.model");
const APPLICATION_CONSTANT = require("../constant/application_constant");
const { getIO } = require("../utilits/socket");
const Mastermodel = require("../models/master/master.model");

const MAX_DISTANCE_KM = 20;
const RESPONSE_TIMEOUT_MS = 15000;
const MAX_RETRY_DURATION_MS = 2 * 60 * 1000;
const MAX_ACTIVE_TIMERS = 500;

const bookingTimers = new Map();

const startMechanicMatching = async (
  bookingId,
  bookingdata,
  lat,
  lng,
  vehicletype,
  radiusKm = 1,
  totalTimeElapsed = 0
) => {
  console.log(`--- Matching started for booking: ${bookingId} ---`);
  console.log(`Radius: ${radiusKm} km, Time elapsed: ${totalTimeElapsed} ms`);

  let chargeperkm = await Mastermodel();

  const booking = await Bookingsmodel.findById(bookingId);
  if (!booking) {
    console.log("Booking not found or deleted.");
    return;
  }

  if (booking.status !== APPLICATION_CONSTANT.PENDING) {
    console.log(
      `Booking ${bookingId} is no longer pending. Current status: ${booking.status}`
    );
    return;
  }

  if (bookingTimers.size >= MAX_ACTIVE_TIMERS) {
    console.log("Too many active timers. Cannot proceed.");
    getIO().to(booking.userid.toString()).emit("bookingFailed", {
      message: "System is currently busy. Please try again shortly.",
    });
    return;
  }

  const mechanics = await Mechanicmodel.find({
    isAvailable: true,
    vehicle_type: { $in: vehicletype },
    _id: { $nin: booking.triedMechanicIds },
    // Uncomment and adjust this if using location-based matching
    // location: {
    //   $near: {
    //     $geometry: { type: "Point", coordinates: [lng, lat] },
    //     $maxDistance: radiusKm * 1000,
    //   },
    // },
  });

  console.log(`Found ${mechanics.length} mechanics (available & not tried)`);

  if (!mechanics.length) {
    if (radiusKm < MAX_DISTANCE_KM) {
      console.log(
        `No mechanics found. Increasing radius to ${radiusKm + 1} km.`
      );
      return startMechanicMatching(
        bookingId,
        bookingdata,
        lat,
        lng,
        vehicletype,
        radiusKm + 1,
        totalTimeElapsed
      );
    } else {
      console.log("No mechanics found within maximum radius. Booking failed.");
      getIO().to(booking.userid.toString()).emit("bookingFailed", {
        message: "No mechanics available within 10 km. Please try again later.",
      });
      return;
    }
  }

  const mechanic = await selectBestMechanic(mechanics);
  if (!mechanic || !mechanic.socketId) {
    console.log("Selected mechanic is offline or invalid. Skipping.");
    booking.triedMechanicIds.push(mechanic?._id);
    await booking.save();
    return startMechanicMatching(
      bookingId,
      bookingdata,
      lat,
      lng,
      vehicletype,
      radiusKm + 1,
      totalTimeElapsed
    );
  }

  console.log("Selected mechanic:", {
    id: mechanic._id.toString(),
    name: mechanic.name,
    socketId: mechanic.socketId,
  });

  booking.triedMechanicIds.push(mechanic._id);
  await booking.save();

  console.log("Sending request to mechanic:", mechanic._id.toString());
  getIO().to(mechanic.socketId).emit("newBookingRequest", {
    bookingId: booking._id,
    userLocation: booking.userLocation.coordinates,
    problem: booking.problem,
    bookingdata: bookingdata,
    perkm: chargeperkm[0].charge_per_km,
  });

  // Clear any existing timer
  if (bookingTimers.has(bookingId)) {
    clearTimeout(bookingTimers.get(bookingId));
    console.log(`Cleared existing timer for booking: ${bookingId}`);
  }

  const timer = setTimeout(async () => {
    console.log(
      `Timeout reached. Waiting for mechanic response expired for booking: ${bookingId}`
    );

    const updatedBooking = await Bookingsmodel.findById(bookingId);
    if (
      updatedBooking &&
      updatedBooking.status === APPLICATION_CONSTANT.PENDING
    ) {
      const newElapsed = totalTimeElapsed + RESPONSE_TIMEOUT_MS;

      if (newElapsed >= MAX_RETRY_DURATION_MS) {
        console.log(`Booking ${bookingId} expired after max wait time.`);
        updatedBooking.status = APPLICATION_CONSTANT.EXPIRED;
        await updatedBooking.save();

        getIO().to(updatedBooking.userid.toString()).emit("bookingFailed", {
          message: "Booking expired. No mechanic accepted in time.",
        });
      } else {
        console.log("No response from mechanic:", mechanic._id.toString());
        console.log(
          `Retrying with increased radius (${
            radiusKm + 1
          }) and time elapsed: ${newElapsed} ms`
        );
        startMechanicMatching(
          bookingId,
          bookingdata,
          lat,
          lng,
          vehicletype,
          radiusKm + 1,
          newElapsed
        );
      }
    }

    bookingTimers.delete(bookingId);
    console.log(`Timer cleared for booking: ${bookingId}`);
  }, RESPONSE_TIMEOUT_MS);

  bookingTimers.set(bookingId, timer);
  console.log(
    `Timer set for booking: ${bookingId} (waiting ${
      RESPONSE_TIMEOUT_MS / 1000
    }s)`
  );
};

const selectBestMechanic = async (mechanics) => {
  let onlineMechanics = mechanics.filter((m) => m.isAvailable);

  if (onlineMechanics.length === 0) {
    onlineMechanics = mechanics;
  }

  const bookingCounts = await Bookingsmodel.aggregate([
    {
      $match: {
        mechanicid: { $in: onlineMechanics.map((m) => m._id) },
        status: {
          $in: [APPLICATION_CONSTANT.PENDING, APPLICATION_CONSTANT.ACCEPTED],
        },
      },
    },
    {
      $group: {
        _id: "$mechanicid",
        count: { $sum: 1 },
      },
    },
  ]);

  const bookingMap = {};
  bookingCounts.forEach((b) => {
    bookingMap[b._id.toString()] = b.count;
  });

  onlineMechanics.sort((a, b) => {
    const countA = bookingMap[a._id.toString()] || 0;
    const countB = bookingMap[b._id.toString()] || 0;
    return countA - countB;
  });

  const topCandidates = onlineMechanics.slice(0, 3);
  return topCandidates[Math.floor(Math.random() * topCandidates.length)];
};

module.exports = startMechanicMatching;
