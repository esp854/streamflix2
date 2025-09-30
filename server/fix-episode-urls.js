"use strict";
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
var dotenv_1 = require("dotenv");
var storage_1 = require("./storage");
// Load environment variables
(0, dotenv_1.config)();
function fixEpisodeUrls() {
    return __awaiter(this, void 0, void 0, function () {
        var dbUrl, allContent, totalEpisodes, fixedEpisodes, _i, _a, content, episodes, _b, episodes_1, episode, fixedUrl, _c, _d, content, episodes, error_1;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 13, , 14]);
                    console.log("Fixing HTML-encoded episode URLs...");
                    // Test database connection
                    console.log("Testing database connection...");
                    dbUrl = process.env.DATABASE_URL;
                    if (!dbUrl) {
                        console.error("DATABASE_URL is not set in environment variables");
                        process.exit(1);
                    }
                    console.log("DATABASE_URL is set");
                    return [4 /*yield*/, storage_1.storage.getAllContent()];
                case 1:
                    allContent = _e.sent();
                    totalEpisodes = 0;
                    fixedEpisodes = 0;
                    _i = 0, _a = allContent.filter(function (c) { return c.mediaType === 'tv'; });
                    _e.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 8];
                    content = _a[_i];
                    return [4 /*yield*/, storage_1.storage.getEpisodesByContentId(content.id)];
                case 3:
                    episodes = _e.sent();
                    totalEpisodes += episodes.length;
                    _b = 0, episodes_1 = episodes;
                    _e.label = 4;
                case 4:
                    if (!(_b < episodes_1.length)) return [3 /*break*/, 7];
                    episode = episodes_1[_b];
                    if (!(episode.odyseeUrl && (episode.odyseeUrl.includes('&amp;#x2F;') || episode.odyseeUrl.includes('&amp;')))) return [3 /*break*/, 6];
                    fixedUrl = episode.odyseeUrl;
                    // Decode HTML entities
                    fixedUrl = fixedUrl
                        .replace(/&amp;#x2F;/g, '/')
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>');
                    console.log("Fixing episode: ".concat(episode.title));
                    console.log("  Old: ".concat(episode.odyseeUrl));
                    console.log("  New: ".concat(fixedUrl));
                    // Update the episode with the fixed URL
                    return [4 /*yield*/, storage_1.storage.updateEpisode(episode.id, { odyseeUrl: fixedUrl })];
                case 5:
                    // Update the episode with the fixed URL
                    _e.sent();
                    console.log("  \u2713 Updated successfully\n");
                    fixedEpisodes++;
                    _e.label = 6;
                case 6:
                    _b++;
                    return [3 /*break*/, 4];
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8:
                    console.log("Found ".concat(totalEpisodes, " episodes in database"));
                    console.log("Fixed ".concat(fixedEpisodes, " episodes with HTML-encoded URLs"));
                    console.log("Episode URL fixing process completed!");
                    // Verify the fixes
                    console.log("\nVerifying fixes...");
                    _c = 0, _d = allContent.filter(function (c) { return c.mediaType === 'tv'; }).slice(0, 3);
                    _e.label = 9;
                case 9:
                    if (!(_c < _d.length)) return [3 /*break*/, 12];
                    content = _d[_c];
                    return [4 /*yield*/, storage_1.storage.getEpisodesByContentId(content.id)];
                case 10:
                    episodes = _e.sent();
                    if (episodes.length > 0) {
                        console.log("\nContent: ".concat(content.title));
                        episodes.slice(0, 3).forEach(function (episode) {
                            console.log("  - Episode ".concat(episode.seasonNumber, "x").concat(episode.episodeNumber, ": ").concat(episode.odyseeUrl));
                        });
                    }
                    _e.label = 11;
                case 11:
                    _c++;
                    return [3 /*break*/, 9];
                case 12: return [3 /*break*/, 14];
                case 13:
                    error_1 = _e.sent();
                    console.error("Error fixing episode URLs:", error_1);
                    process.exit(1);
                    return [3 /*break*/, 14];
                case 14: return [2 /*return*/];
            }
        });
    });
}
// Run the fix
fixEpisodeUrls();
