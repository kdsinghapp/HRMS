import  ipRangeCheck  from 'ip-range-check';

// export const isOfficeIP = (ip) => {
//   if (process.env.NODE_ENV !== "production") {
//     return true;
//   }

//   return ipRangeCheck(ip, process.env.OFFICE_IPS.split(","));
// };



export const isOfficeIP = (ip) => {
  if (ip === "::1" || ip === "127.0.0.1") {
    return true; // ✅ allow localhost for dev
  }

  return ipRangeCheck(ip, process.env.OFFICE_IPS.split(","));
};
