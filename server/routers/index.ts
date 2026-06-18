import { systemRouter } from "../_core/systemRouter";
import { router } from "../_core/trpc";
import { ifoodRouter } from "../ifoodRouter";
import { adminRouter } from "../adminRouter";

import { authRouter } from "./auth";
import { establishmentRouter } from "./establishment";
import { categoryRouter } from "./category";
import { menuViewsRouter } from "./menuViews";
import { productRouter } from "./product";
import { complementRouter } from "./complement";
import { orderRouter } from "./order";
import { dashboardRouter } from "./dashboard";
import { stockRouter } from "./stock";
import { publicMenuRouter } from "./publicMenu";
import { ordersRouter } from "./orders";
import { couponRouter } from "./coupons";
import { loyaltyRouter } from "./loyalty";
import { uploadRouter } from "./upload";
import { neighborhoodFeesRouter } from "./neighborhoodFees";
import { radiusFeesRouter } from "./radiusFees";
import { mapsRouter } from "./maps";
import { printerRouter } from "./printer";
import { pushRouter } from "./push";
import { whatsappRouter } from "./whatsapp";
import { campanhasRouter } from "./campanhas";
import { aiCreditsRouter } from "./aiCredits";
import { tablesRouter } from "./tables";
import { tabsRouter } from "./tabs";
import { plansRouter } from "./plans";
import { pdvCustomerRouter } from "./pdvCustomer";
import { reviewsAdminRouter } from "./reviewsAdmin";
import { comboRouter } from "./combo";
import { driverRouter } from "./drivers";
import { schedulingRouter } from "./scheduling";
import { financeRouter } from "./finance";
import { cashbackRouter } from "./cashback";
import { botApiKeysRouter } from "./botApiKeys";
import { feedbackRouter } from "./feedback";
import { storiesRouter } from "./stories";
import { publicStoriesRouter } from "./publicStories";
import { collaboratorRouter } from "./collaborator";
import { emailVerificationRouter } from "./emailVerification";
import { whatsappChatRouter } from "./whatsappChat";
import { tableSpacesRouter } from "./tableSpaces";
import { reportsRouter } from "./reports";
import { scheduledClosuresRouter } from "./scheduledClosures";
import { changelogRouter } from "./changelog";
import { chatShortcutsRouter } from "./chatShortcuts";
import { paytimeRouter } from "./paytime";
import { suggestionsRouter } from "./suggestions";
import { preferencesRouter } from "./preferences";
import { telegramRouter } from "./telegram";
import { planPaytimeRouter } from "./planPaytime";
import { catalogVersionRouter } from "./catalogVersion";
import { cashRegisterRouter } from "./cashRegister";
import { cashReminderRouter } from "./cashReminder";
import { cancelRetentionRouter } from "./cancelRetention";
import { substitutionRouter } from "./substitution";

export const appRouter = router({
  system: systemRouter,
  ifood: ifoodRouter,
  admin: adminRouter,
  auth: authRouter,
  establishment: establishmentRouter,
  category: categoryRouter,
  menuViews: menuViewsRouter,
  product: productRouter,
  complement: complementRouter,
  order: orderRouter,
  dashboard: dashboardRouter,
  stock: stockRouter,
  publicMenu: publicMenuRouter,
  orders: ordersRouter,
  coupon: couponRouter,
  loyalty: loyaltyRouter,
  upload: uploadRouter,
  neighborhoodFees: neighborhoodFeesRouter,
  radiusFees: radiusFeesRouter,
  maps: mapsRouter,
  printer: printerRouter,
  push: pushRouter,
  whatsapp: whatsappRouter,
  campanhas: campanhasRouter,
  aiCredits: aiCreditsRouter,
  tables: tablesRouter,
  tabs: tabsRouter,
  plans: plansRouter,
  pdvCustomer: pdvCustomerRouter,
  reviewsAdmin: reviewsAdminRouter,
  combo: comboRouter,
  driver: driverRouter,
  scheduling: schedulingRouter,
  finance: financeRouter,
  cashback: cashbackRouter,
  botApiKeys: botApiKeysRouter,
  feedback: feedbackRouter,
  stories: storiesRouter,
  publicStories: publicStoriesRouter,
  collaborator: collaboratorRouter,
  emailVerification: emailVerificationRouter,
  whatsappChat: whatsappChatRouter,
  tableSpaces: tableSpacesRouter,
  reports: reportsRouter,
  scheduledClosures: scheduledClosuresRouter,
  changelog: changelogRouter,
  chatShortcuts: chatShortcutsRouter,
  paytime: paytimeRouter,
  suggestions: suggestionsRouter,
  preferences: preferencesRouter,
  telegram: telegramRouter,
  planPaytime: planPaytimeRouter,
  catalogVersion: catalogVersionRouter,
  cashRegister: cashRegisterRouter,
  cashReminder: cashReminderRouter,
  cancelRetention: cancelRetentionRouter,
  substitution: substitutionRouter,
});

export type AppRouter = typeof appRouter;
