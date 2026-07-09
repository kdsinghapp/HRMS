


export const getISTDate = () => {
  const now = new Date();

  // UTC -> IST (+5:30)
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);

  // IST midnight
  return new Date(Date.UTC(
    ist.getUTCFullYear(),
    ist.getUTCMonth(),
    ist.getUTCDate()
  ));
};