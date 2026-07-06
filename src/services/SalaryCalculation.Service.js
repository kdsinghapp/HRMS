export const calculateSalary = ({
  grossSalary,
  workingDays,
  absentDays = 0,
  unpaidLeaves = 0,
  deductions = 0,
}) => {
  if (!workingDays || workingDays <= 0) {
    throw new Error("Working days must be greater than 0");
  }

  const perDaySalary = grossSalary / workingDays;

  const leaveDeduction =
    perDaySalary * (absentDays + unpaidLeaves);

  const netSalary =
    grossSalary - leaveDeduction - deductions;

  return {
    grossSalary,
    perDaySalary,
    leaveDeduction,
    deductions,
    netSalary: Math.max(0, netSalary),
  };
};