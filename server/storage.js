"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.DatabaseStorage = void 0;
var schema_1 = require("@shared/schema");
var db_1 = require("./db");
var drizzle_orm_1 = require("drizzle-orm");
var DatabaseStorage = /** @class */ (function () {
    function DatabaseStorage() {
    }
    // Users
    DatabaseStorage.prototype.getUser = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validate input to prevent injection
                        if (!id || typeof id !== 'string') {
                            throw new Error('Invalid user ID');
                        }
                        return [4 /*yield*/, db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id))];
                    case 1:
                        user = (_a.sent())[0];
                        return [2 /*return*/, user || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getUser(id)];
            });
        });
    };
    DatabaseStorage.prototype.getUserByUsername = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validate input to prevent injection
                        if (!username || typeof username !== 'string') {
                            throw new Error('Invalid username');
                        }
                        return [4 /*yield*/, db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.username, username))];
                    case 1:
                        user = (_a.sent())[0];
                        return [2 /*return*/, user || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserByEmail = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validate input to prevent injection
                        if (!email || typeof email !== 'string') {
                            throw new Error('Invalid email');
                        }
                        return [4 /*yield*/, db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email))];
                    case 1:
                        user = (_a.sent())[0];
                        return [2 /*return*/, user || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.createUser = function (insertUser) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validate input
                        if (!insertUser.username || !insertUser.email || !insertUser.password) {
                            throw new Error('Missing required user fields');
                        }
                        return [4 /*yield*/, db_1.db.insert(schema_1.users).values(insertUser).returning()];
                    case 1:
                        user = (_a.sent())[0];
                        return [2 /*return*/, user];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAllUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.users).orderBy((0, drizzle_orm_1.desc)(schema_1.users.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.banUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validate input
                        if (!userId || typeof userId !== 'string') {
                            throw new Error('Invalid user ID');
                        }
                        return [4 /*yield*/, db_1.db
                                .update(schema_1.users)
                                .set({ banned: true })
                                .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
                                .returning()];
                    case 1:
                        user = (_a.sent())[0];
                        if (!user) {
                            throw new Error('User not found');
                        }
                        return [2 /*return*/, user];
                }
            });
        });
    };
    DatabaseStorage.prototype.unbanUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validate input
                        if (!userId || typeof userId !== 'string') {
                            throw new Error('Invalid user ID');
                        }
                        return [4 /*yield*/, db_1.db
                                .update(schema_1.users)
                                .set({ banned: false })
                                .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
                                .returning()];
                    case 1:
                        user = (_a.sent())[0];
                        if (!user) {
                            throw new Error('User not found');
                        }
                        return [2 /*return*/, user];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateUser = function (userId, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validate input
                        if (!userId || typeof userId !== 'string') {
                            throw new Error('Invalid user ID');
                        }
                        return [4 /*yield*/, db_1.db
                                .update(schema_1.users)
                                .set(updates)
                                .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
                                .returning()];
                    case 1:
                        user = (_a.sent())[0];
                        if (!user) {
                            throw new Error('User not found');
                        }
                        return [2 /*return*/, user];
                }
            });
        });
    };
    // Favorites
    DatabaseStorage.prototype.getFavorites = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validate input
                        if (!userId || typeof userId !== 'string') {
                            throw new Error('Invalid user ID');
                        }
                        return [4 /*yield*/, db_1.db
                                .select()
                                .from(schema_1.favorites)
                                .where((0, drizzle_orm_1.eq)(schema_1.favorites.userId, userId))
                                .orderBy((0, drizzle_orm_1.desc)(schema_1.favorites.addedAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.addFavorite = function (favorite) {
        return __awaiter(this, void 0, void 0, function () {
            var newFavorite;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validate input
                        if (!favorite.userId || !favorite.movieId) {
                            throw new Error('Missing required favorite fields');
                        }
                        return [4 /*yield*/, db_1.db.insert(schema_1.favorites).values(favorite).returning()];
                    case 1:
                        newFavorite = (_a.sent())[0];
                        return [2 /*return*/, newFavorite];
                }
            });
        });
    };
    DatabaseStorage.prototype.removeFavorite = function (userId, movieId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validate input
                        if (!userId || typeof userId !== 'string' || !movieId || typeof movieId !== 'number') {
                            throw new Error('Invalid user ID or movie ID');
                        }
                        return [4 /*yield*/, db_1.db
                                .delete(schema_1.favorites)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.favorites.userId, userId), (0, drizzle_orm_1.eq)(schema_1.favorites.movieId, movieId)))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.isFavorite = function (userId, movieId) {
        return __awaiter(this, void 0, void 0, function () {
            var favorite;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validate input
                        if (!userId || typeof userId !== 'string' || !movieId || typeof movieId !== 'number') {
                            throw new Error('Invalid user ID or movie ID');
                        }
                        return [4 /*yield*/, db_1.db
                                .select()
                                .from(schema_1.favorites)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.favorites.userId, userId), (0, drizzle_orm_1.eq)(schema_1.favorites.movieId, movieId)))];
                    case 1:
                        favorite = (_a.sent())[0];
                        return [2 /*return*/, !!favorite];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAllFavorites = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.favorites).orderBy((0, drizzle_orm_1.desc)(schema_1.favorites.addedAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Watch History
    DatabaseStorage.prototype.getWatchHistory = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.watchHistory)
                            .where((0, drizzle_orm_1.eq)(schema_1.watchHistory.userId, userId))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.watchHistory.watchedAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.addToWatchHistory = function (history) {
        return __awaiter(this, void 0, void 0, function () {
            var newHistory;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.watchHistory).values(history).returning()];
                    case 1:
                        newHistory = (_a.sent())[0];
                        return [2 /*return*/, newHistory];
                }
            });
        });
    };
    // Watch Progress
    DatabaseStorage.prototype.getWatchProgress = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.watchProgress)
                            .where((0, drizzle_orm_1.eq)(schema_1.watchProgress.userId, userId))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.watchProgress.lastWatchedAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.createWatchProgress = function (progress) {
        return __awaiter(this, void 0, void 0, function () {
            var newProgress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.watchProgress).values(progress).returning()];
                    case 1:
                        newProgress = (_a.sent())[0];
                        return [2 /*return*/, newProgress];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateWatchProgress = function (progressId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.watchProgress)
                            .set(__assign(__assign({}, data), { updatedAt: new Date() }))
                            .where((0, drizzle_orm_1.eq)(schema_1.watchProgress.id, progressId))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteWatchProgress = function (progressId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.watchProgress).where((0, drizzle_orm_1.eq)(schema_1.watchProgress.id, progressId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getWatchProgressByContent = function (userId, contentId, episodeId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, progress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = db_1.db
                            .select()
                            .from(schema_1.watchProgress)
                            .where((0, drizzle_orm_1.eq)(schema_1.watchProgress.userId, userId));
                        if (episodeId) {
                            query = query.where((0, drizzle_orm_1.eq)(schema_1.watchProgress.episodeId, episodeId));
                        }
                        else if (contentId) {
                            query = query.where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.watchProgress.contentId, contentId), (0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " IS NULL"], ["", " IS NULL"])), schema_1.watchProgress.episodeId)));
                        }
                        return [4 /*yield*/, query.limit(1)];
                    case 1:
                        progress = (_a.sent())[0];
                        return [2 /*return*/, progress || undefined];
                }
            });
        });
    };
    // User Preferences
    DatabaseStorage.prototype.getUserPreferences = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var prefs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.userPreferences)
                            .where((0, drizzle_orm_1.eq)(schema_1.userPreferences.userId, userId))];
                    case 1:
                        prefs = (_a.sent())[0];
                        return [2 /*return*/, prefs || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateUserPreferences = function (userId, preferences) {
        return __awaiter(this, void 0, void 0, function () {
            var existingPrefs, updated, created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUserPreferences(userId)];
                    case 1:
                        existingPrefs = _a.sent();
                        if (!existingPrefs) return [3 /*break*/, 3];
                        return [4 /*yield*/, db_1.db
                                .update(schema_1.userPreferences)
                                .set(preferences)
                                .where((0, drizzle_orm_1.eq)(schema_1.userPreferences.userId, userId))
                                .returning()];
                    case 2:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                    case 3: return [4 /*yield*/, db_1.db
                            .insert(schema_1.userPreferences)
                            .values(__assign({ userId: userId }, preferences))
                            .returning()];
                    case 4:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    // Contact Messages
    DatabaseStorage.prototype.createContactMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var newMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.contactMessages).values(message).returning()];
                    case 1:
                        newMessage = (_a.sent())[0];
                        return [2 /*return*/, newMessage];
                }
            });
        });
    };
    DatabaseStorage.prototype.getContactMessages = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.contactMessages)
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.contactMessages.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteContactMessage = function (messageId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.contactMessages).where((0, drizzle_orm_1.eq)(schema_1.contactMessages.id, messageId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Subscriptions
    DatabaseStorage.prototype.createSubscription = function (subscription) {
        return __awaiter(this, void 0, void 0, function () {
            var newSubscription;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.subscriptions).values(subscription).returning()];
                    case 1:
                        newSubscription = (_a.sent())[0];
                        return [2 /*return*/, newSubscription];
                }
            });
        });
    };
    DatabaseStorage.prototype.getSubscriptions = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.subscriptions).orderBy((0, drizzle_orm_1.desc)(schema_1.subscriptions.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserSubscription = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var subscription;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.subscriptions)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.subscriptions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.subscriptions.status, 'active')))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.subscriptions.createdAt))];
                    case 1:
                        subscription = (_a.sent())[0];
                        return [2 /*return*/, subscription || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateSubscription = function (subscriptionId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.subscriptions)
                            .set(data)
                            .where((0, drizzle_orm_1.eq)(schema_1.subscriptions.id, subscriptionId))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.getSubscriptionByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var subscription;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.subscriptions)
                            .where((0, drizzle_orm_1.eq)(schema_1.subscriptions.userId, userId))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.subscriptions.createdAt))];
                    case 1:
                        subscription = (_a.sent())[0];
                        return [2 /*return*/, subscription || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.cancelSubscription = function (subscriptionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.subscriptions)
                            .set({ status: 'cancelled' })
                            .where((0, drizzle_orm_1.eq)(schema_1.subscriptions.id, subscriptionId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Payments
    DatabaseStorage.prototype.createPayment = function (payment) {
        return __awaiter(this, void 0, void 0, function () {
            var newPayment;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.payments).values(payment).returning()];
                    case 1:
                        newPayment = (_a.sent())[0];
                        return [2 /*return*/, newPayment];
                }
            });
        });
    };
    DatabaseStorage.prototype.getPayments = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.payments).orderBy((0, drizzle_orm_1.desc)(schema_1.payments.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserPayments = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.payments)
                            .where((0, drizzle_orm_1.eq)(schema_1.payments.userId, userId))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.payments.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getPaymentById = function (paymentId) {
        return __awaiter(this, void 0, void 0, function () {
            var payment;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.payments)
                            .where((0, drizzle_orm_1.eq)(schema_1.payments.id, paymentId))];
                    case 1:
                        payment = (_a.sent())[0];
                        return [2 /*return*/, payment || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.updatePaymentStatus = function (paymentId, status) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.payments)
                            .set({ status: status })
                            .where((0, drizzle_orm_1.eq)(schema_1.payments.id, paymentId))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    // Add a method to create or update subscription
    DatabaseStorage.prototype.createOrUpdateSubscription = function (subscriptionData) {
        return __awaiter(this, void 0, void 0, function () {
            var existingSubscription, updated, newSubscription;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUserSubscription(subscriptionData.userId)];
                    case 1:
                        existingSubscription = _a.sent();
                        if (!existingSubscription) return [3 /*break*/, 3];
                        return [4 /*yield*/, db_1.db
                                .update(schema_1.subscriptions)
                                .set(subscriptionData)
                                .where((0, drizzle_orm_1.eq)(schema_1.subscriptions.id, existingSubscription.id))
                                .returning()];
                    case 2:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                    case 3: return [4 /*yield*/, db_1.db.insert(schema_1.subscriptions).values(subscriptionData).returning()];
                    case 4:
                        newSubscription = (_a.sent())[0];
                        return [2 /*return*/, newSubscription];
                }
            });
        });
    };
    // Banners
    DatabaseStorage.prototype.createBanner = function (banner) {
        return __awaiter(this, void 0, void 0, function () {
            var newBanner;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.banners).values(banner).returning()];
                    case 1:
                        newBanner = (_a.sent())[0];
                        return [2 /*return*/, newBanner];
                }
            });
        });
    };
    DatabaseStorage.prototype.getBanners = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.banners).orderBy((0, drizzle_orm_1.desc)(schema_1.banners.priority))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateBanner = function (bannerId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.banners)
                            .set(data)
                            .where((0, drizzle_orm_1.eq)(schema_1.banners.id, bannerId))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteBanner = function (bannerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.banners).where((0, drizzle_orm_1.eq)(schema_1.banners.id, bannerId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Collections
    DatabaseStorage.prototype.createCollection = function (collection) {
        return __awaiter(this, void 0, void 0, function () {
            var newCollection;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.collections).values(collection).returning()];
                    case 1:
                        newCollection = (_a.sent())[0];
                        return [2 /*return*/, newCollection];
                }
            });
        });
    };
    DatabaseStorage.prototype.getCollections = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.collections).orderBy((0, drizzle_orm_1.desc)(schema_1.collections.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateCollection = function (collectionId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.collections)
                            .set(data)
                            .where((0, drizzle_orm_1.eq)(schema_1.collections.id, collectionId))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteCollection = function (collectionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.collections).where((0, drizzle_orm_1.eq)(schema_1.collections.id, collectionId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Notifications
    DatabaseStorage.prototype.createNotification = function (notification) {
        return __awaiter(this, void 0, void 0, function () {
            var newNotification;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.notifications).values(notification).returning()];
                    case 1:
                        newNotification = (_a.sent())[0];
                        return [2 /*return*/, newNotification];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserNotifications = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.notifications)
                            .where((0, drizzle_orm_1.eq)(schema_1.notifications.userId, userId))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.notifications.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getNotificationById = function (notificationId) {
        return __awaiter(this, void 0, void 0, function () {
            var notification;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.notifications)
                            .where((0, drizzle_orm_1.eq)(schema_1.notifications.id, notificationId))];
                    case 1:
                        notification = (_a.sent())[0];
                        return [2 /*return*/, notification || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAllNotifications = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.notifications)
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.notifications.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.markNotificationRead = function (notificationId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.notifications)
                            .set({ read: true })
                            .where((0, drizzle_orm_1.eq)(schema_1.notifications.id, notificationId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteNotification = function (notificationId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.notifications).where((0, drizzle_orm_1.eq)(schema_1.notifications.id, notificationId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Add missing delete functions
    DatabaseStorage.prototype.deleteUserPreferences = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.userPreferences).where((0, drizzle_orm_1.eq)(schema_1.userPreferences.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteUser = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteSubscription = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.subscriptions).where((0, drizzle_orm_1.eq)(schema_1.subscriptions.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.deletePayment = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.payments).where((0, drizzle_orm_1.eq)(schema_1.payments.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteUserSession = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.userSessions).where((0, drizzle_orm_1.eq)(schema_1.userSessions.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteViewTracking = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.viewTracking).where((0, drizzle_orm_1.eq)(schema_1.viewTracking.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // User Management
    DatabaseStorage.prototype.updateUserStatus = function (userId, status) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUserById(userId)];
                    case 1:
                        user = _a.sent();
                        if (!user)
                            throw new Error('User not found');
                        return [2 /*return*/, user];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateUserSubscriptionPlan = function (userId, planId) {
        return __awaiter(this, void 0, void 0, function () {
            var planPrices, amount, endDate;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Update current subscription status to cancelled
                    return [4 /*yield*/, db_1.db
                            .update(schema_1.subscriptions)
                            .set({ status: 'cancelled' })
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.subscriptions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.subscriptions.status, 'active')))];
                    case 1:
                        // Update current subscription status to cancelled
                        _a.sent();
                        planPrices = { basic: 2500, standard: 4500, premium: 7500 };
                        amount = planPrices[planId] || 2500;
                        endDate = new Date();
                        endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription
                        return [4 /*yield*/, this.createSubscription({
                                userId: userId,
                                planId: planId,
                                amount: amount,
                                paymentMethod: 'admin_update',
                                status: 'active',
                                startDate: new Date(),
                                endDate: endDate
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // User Sessions
    DatabaseStorage.prototype.createUserSession = function (session) {
        return __awaiter(this, void 0, void 0, function () {
            var newSession;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.userSessions).values(session).returning()];
                    case 1:
                        newSession = (_a.sent())[0];
                        return [2 /*return*/, newSession];
                }
            });
        });
    };
    DatabaseStorage.prototype.getActiveSessions = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.userSessions)
                            .where((0, drizzle_orm_1.eq)(schema_1.userSessions.isActive, true))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.userSessions.sessionStart))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.endUserSession = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.userSessions)
                            .set({
                            isActive: false,
                            sessionEnd: new Date()
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.userSessions.id, sessionId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // View Tracking
    DatabaseStorage.prototype.createViewTracking = function (view) {
        return __awaiter(this, void 0, void 0, function () {
            var newView;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.viewTracking).values(view).returning()];
                    case 1:
                        newView = (_a.sent())[0];
                        return [2 /*return*/, newView];
                }
            });
        });
    };
    DatabaseStorage.prototype.getViewStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var daily, weekly, error_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, db_1.db
                                .select({ count: (0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["COUNT(*)"], ["COUNT(*)"]))) })
                                .from(schema_1.viewTracking)
                                .where((0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", " >= NOW() - INTERVAL '1 day'"], ["", " >= NOW() - INTERVAL '1 day'"])), schema_1.viewTracking.viewDate))];
                    case 1:
                        daily = (_c.sent())[0];
                        return [4 /*yield*/, db_1.db
                                .select({ count: (0, drizzle_orm_1.sql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["COUNT(*)"], ["COUNT(*)"]))) })
                                .from(schema_1.viewTracking)
                                .where((0, drizzle_orm_1.sql)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["", " >= NOW() - INTERVAL '7 days'"], ["", " >= NOW() - INTERVAL '7 days'"])), schema_1.viewTracking.viewDate))];
                    case 2:
                        weekly = (_c.sent())[0];
                        return [2 /*return*/, {
                                dailyViews: Number((_a = daily === null || daily === void 0 ? void 0 : daily.count) !== null && _a !== void 0 ? _a : 0),
                                weeklyViews: Number((_b = weekly === null || weekly === void 0 ? void 0 : weekly.count) !== null && _b !== void 0 ? _b : 0)
                            }];
                    case 3:
                        error_1 = _c.sent();
                        console.error('Error fetching view stats:', error_1);
                        return [2 /*return*/, { dailyViews: 0, weeklyViews: 0 }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Content Management
    DatabaseStorage.prototype.createContent = function (insertContent) {
        return __awaiter(this, void 0, void 0, function () {
            var newContent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.content).values(insertContent).returning()];
                    case 1:
                        newContent = (_a.sent())[0];
                        return [2 /*return*/, newContent];
                }
            });
        });
    };
    DatabaseStorage.prototype.getContent = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.content)
                            .where((0, drizzle_orm_1.eq)(schema_1.content.active, true))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.content.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getContentById = function (contentId) {
        return __awaiter(this, void 0, void 0, function () {
            var item;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.content)
                            .where((0, drizzle_orm_1.eq)(schema_1.content.id, contentId))];
                    case 1:
                        item = (_a.sent())[0];
                        return [2 /*return*/, item || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateContent = function (contentId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.content)
                            .set(__assign(__assign({}, data), { updatedAt: new Date() }))
                            .where((0, drizzle_orm_1.eq)(schema_1.content.id, contentId))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteContent = function (contentId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.content)
                            .set({ active: false, updatedAt: new Date() })
                            .where((0, drizzle_orm_1.eq)(schema_1.content.id, contentId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getContentByTmdbId = function (tmdbId) {
        return __awaiter(this, void 0, void 0, function () {
            var item;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.content)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.content.tmdbId, tmdbId), (0, drizzle_orm_1.eq)(schema_1.content.active, true)))];
                    case 1:
                        item = (_a.sent())[0];
                        return [2 /*return*/, item || undefined];
                }
            });
        });
    };
    // New method to get content by TMDB ID regardless of active status (for debugging)
    DatabaseStorage.prototype.getContentByTmdbIdAnyStatus = function (tmdbId) {
        return __awaiter(this, void 0, void 0, function () {
            var item;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.content)
                            .where((0, drizzle_orm_1.eq)(schema_1.content.tmdbId, tmdbId))];
                    case 1:
                        item = (_a.sent())[0];
                        return [2 /*return*/, item || undefined];
                }
            });
        });
    };
    // New method to get content by URL (for debugging)
    DatabaseStorage.prototype.getContentByOdyseeUrl = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var item;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.content)
                            .where((0, drizzle_orm_1.eq)(schema_1.content.odyseeUrl, url))];
                    case 1:
                        item = (_a.sent())[0];
                        return [2 /*return*/, item || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAllContent = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.content)
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.content.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Add missing content functions
    DatabaseStorage.prototype.getBannerById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var banner;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.banners).where((0, drizzle_orm_1.eq)(schema_1.banners.id, id))];
                    case 1:
                        banner = (_a.sent())[0];
                        return [2 /*return*/, banner || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.getBannersByCollectionId = function (collectionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Banners don't have collectionId in schema, return empty array
                return [2 /*return*/, []];
            });
        });
    };
    DatabaseStorage.prototype.getAllCollections = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.collections).orderBy((0, drizzle_orm_1.desc)(schema_1.collections.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getCollectionById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var collection;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.collections).where((0, drizzle_orm_1.eq)(schema_1.collections.id, id))];
                    case 1:
                        collection = (_a.sent())[0];
                        return [2 /*return*/, collection || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.getContentsByCollectionId = function (collectionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Content doesn't have collectionId in schema, return empty array
                return [2 /*return*/, []];
            });
        });
    };
    DatabaseStorage.prototype.getContentBySlug = function (slug) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Content doesn't have slug in schema, return undefined
                return [2 /*return*/, undefined];
            });
        });
    };
    DatabaseStorage.prototype.getContentByType = function (type) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.content)
                            .where((0, drizzle_orm_1.eq)(schema_1.content.mediaType, type))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.content.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getContentByGenre = function (genre) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.content)
                            .where((0, drizzle_orm_1.sql)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["genres LIKE ", ""], ["genres LIKE ", ""])), '%' + genre + '%'))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.content.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getContentByYear = function (year) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.content)
                            .where((0, drizzle_orm_1.sql)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["release_date LIKE ", ""], ["release_date LIKE ", ""])), year + '%'))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.content.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getNotificationsByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.notifications)
                            .where((0, drizzle_orm_1.eq)(schema_1.notifications.userId, userId))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.notifications.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserSessionByToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // User sessions don't have token in schema, return undefined
                return [2 /*return*/, undefined];
            });
        });
    };
    DatabaseStorage.prototype.getUserSessionByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var session;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.userSessions)
                            .where((0, drizzle_orm_1.eq)(schema_1.userSessions.userId, userId))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.userSessions.sessionStart))];
                    case 1:
                        session = (_a.sent())[0];
                        return [2 /*return*/, session || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.getViewTrackingByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.viewTracking)
                            .where((0, drizzle_orm_1.eq)(schema_1.viewTracking.userId, userId))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.viewTracking.viewDate))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Episode Management
    DatabaseStorage.prototype.createEpisode = function (episode) {
        return __awaiter(this, void 0, void 0, function () {
            var newEpisode;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.episodes).values(episode).returning()];
                    case 1:
                        newEpisode = (_a.sent())[0];
                        return [2 /*return*/, newEpisode];
                }
            });
        });
    };
    DatabaseStorage.prototype.getEpisodesByContentId = function (contentId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2, msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, db_1.db
                                .select()
                                .from(schema_1.episodes)
                                .where((0, drizzle_orm_1.eq)(schema_1.episodes.contentId, contentId))
                                .orderBy(schema_1.episodes.seasonNumber, schema_1.episodes.episodeNumber)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_2 = _a.sent();
                        msg = (error_2 === null || error_2 === void 0 ? void 0 : error_2.message) || '';
                        // Handle case where episodes table is not yet created/migrated
                        if (typeof msg === 'string' && (msg.includes('relation "episodes" does not exist') || msg.includes("relation 'episodes' does not exist") || msg.includes('undefined table: episodes'))) {
                            console.warn('[episodes] table missing; returning empty list. Run migrations to create the table.');
                            return [2 /*return*/, []];
                        }
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getEpisodeById = function (episodeId) {
        return __awaiter(this, void 0, void 0, function () {
            var episode;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.episodes)
                            .where((0, drizzle_orm_1.eq)(schema_1.episodes.id, episodeId))];
                    case 1:
                        episode = (_a.sent())[0];
                        return [2 /*return*/, episode || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateEpisode = function (episodeId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.episodes)
                            .set(__assign(__assign({}, data), { updatedAt: new Date() }))
                            .where((0, drizzle_orm_1.eq)(schema_1.episodes.id, episodeId))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteEpisode = function (episodeId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.episodes)
                            .where((0, drizzle_orm_1.eq)(schema_1.episodes.id, episodeId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Comments
    DatabaseStorage.prototype.createComment = function (comment) {
        return __awaiter(this, void 0, void 0, function () {
            var newComment;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.comments).values(comment).returning()];
                    case 1:
                        newComment = (_a.sent())[0];
                        return [2 /*return*/, newComment];
                }
            });
        });
    };
    DatabaseStorage.prototype.getCommentsByContentId = function (contentId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.comments)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.comments.contentId, contentId), (0, drizzle_orm_1.eq)(schema_1.comments.approved, true)))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.comments.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getCommentById = function (commentId) {
        return __awaiter(this, void 0, void 0, function () {
            var comment;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.comments)
                            .where((0, drizzle_orm_1.eq)(schema_1.comments.id, commentId))];
                    case 1:
                        comment = (_a.sent())[0];
                        return [2 /*return*/, comment || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateComment = function (commentId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.comments)
                            .set(__assign(__assign({}, data), { updatedAt: new Date() }))
                            .where((0, drizzle_orm_1.eq)(schema_1.comments.id, commentId))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateCommentApproval = function (commentId, approved) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.comments)
                            .set({ approved: approved, updatedAt: new Date() })
                            .where((0, drizzle_orm_1.eq)(schema_1.comments.id, commentId))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteComment = function (commentId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.comments).where((0, drizzle_orm_1.eq)(schema_1.comments.id, commentId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAllComments = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.comments)
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.comments.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return DatabaseStorage;
}());
exports.DatabaseStorage = DatabaseStorage;
exports.storage = new DatabaseStorage();
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
