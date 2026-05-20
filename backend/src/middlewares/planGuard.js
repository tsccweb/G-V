exports.planGuard = (requiredPlan) => {
  return (req, res, next) => {
    const planHierarchy = ['FREE', 'PRO', 'PREMIUM'];
    const userPlanIndex = planHierarchy.indexOf(req.user.plan);
    const requiredPlanIndex = planHierarchy.indexOf(requiredPlan);

    if (userPlanIndex < requiredPlanIndex) {
      return res.status(403).json({
        error: `Feature restricted. ${requiredPlan} plan required.`,
        currentPlan: req.user.plan
      });
    }
    next();
  };
};
