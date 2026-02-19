import Array "mo:core/Array";
import Text "mo:core/Text";
import Float "mo:core/Float";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  include MixinStorage();

  public type UserProfile = {
    name : Text;
  };

  public query ({ caller }) func isReady() : async Bool {
    true;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public type MangaEntry = {
    stableId : Nat;
    title : Text;
    alternateTitles : [Text];
    genres : [Text];
    coverImages : [Storage.ExternalBlob];
    synopsis : Text;
    chaptersRead : Float;
    availableChapters : Float;
    notes : Text;
    bookmarks : [Nat];
    rating : Float;
    completed : Bool;
    isBookmarked : Bool;
  };

  module MangaEntry {
    public func compareByTitle(manga1 : MangaEntry, manga2 : MangaEntry) : Order.Order {
      Text.compare(manga1.title, manga2.title);
    };
  };

  type MangaPage = {
    entries : [MangaEntry];
    pageNumber : Nat;
    totalPages : Nat;
  };

  type UpdateFields = {
    stableId : Nat;
    title : ?Text;
    alternateTitles : ?[Text];
    genres : ?[Text];
    coverImages : ?[Storage.ExternalBlob];
    synopsis : ?Text;
    chaptersRead : ?Float;
    availableChapters : ?Float;
    notes : ?Text;
    bookmarks : ?[Nat];
    rating : ?Float;
    completed : ?Bool;
    isBookmarked : ?Bool;
  };

  let userMangaEntries = Map.empty<Principal, Map.Map<Nat, MangaEntry>>();
  let entriesPerPage = 30;

  func getUserMangaMap(user : Principal) : Map.Map<Nat, MangaEntry> {
    switch (userMangaEntries.get(user)) {
      case (null) {
        let newMap = Map.empty<Nat, MangaEntry>();
        userMangaEntries.add(user, newMap);
        newMap;
      };
      case (?existingMap) { existingMap };
    };
  };

  func getUserMangaMapReadOnly(user : Principal) : Map.Map<Nat, MangaEntry> {
    switch (userMangaEntries.get(user)) {
      case (null) {
        Map.empty<Nat, MangaEntry>();
      };
      case (?existingMap) { existingMap };
    };
  };

  public shared ({ caller }) func addEntry(manga : MangaEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add manga entries");
    };

    let userMap = getUserMangaMap(caller);
    userMap.add(manga.stableId, manga);
  };

  public shared ({ caller }) func updateEntry(stableId : Nat, updates : UpdateFields) : async MangaEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update manga entries");
    };

    let userMap = getUserMangaMap(caller);
    switch (userMap.get(stableId)) {
      case (null) { Runtime.trap("Manga entry does not exist") };
      case (?existing) {
        let updatedEntry : MangaEntry = updateManga(existing, updates);
        userMap.add(stableId, updatedEntry);
        updatedEntry;
      };
    };
  };

  func updateManga(entry : MangaEntry, updates : UpdateFields) : MangaEntry {
    {
      stableId = updates.stableId;
      title = switch (updates.title) {
        case (null) { entry.title };
        case (?new) { new };
      };
      alternateTitles = switch (updates.alternateTitles) {
        case (null) { entry.alternateTitles };
        case (?new) { new };
      };
      genres = switch (updates.genres) {
        case (null) { entry.genres };
        case (?new) { new };
      };
      coverImages = switch (updates.coverImages) {
        case (null) { entry.coverImages };
        case (?new) { new };
      };
      synopsis = switch (updates.synopsis) {
        case (null) { entry.synopsis };
        case (?new) { new };
      };
      chaptersRead = switch (updates.chaptersRead) {
        case (null) { entry.chaptersRead };
        case (?new) { new };
      };
      availableChapters = switch (updates.availableChapters) {
        case (null) { entry.availableChapters };
        case (?new) { new };
      };
      notes = switch (updates.notes) {
        case (null) { entry.notes };
        case (?new) { new };
      };
      bookmarks = switch (updates.bookmarks) {
        case (null) { entry.bookmarks };
        case (?new) { new };
      };
      rating = switch (updates.rating) {
        case (null) { entry.rating };
        case (?new) { new };
      };
      completed = switch (updates.completed) {
        case (null) { entry.completed };
        case (?new) { new };
      };
      isBookmarked = switch (updates.isBookmarked) {
        case (null) { entry.isBookmarked };
        case (?new) { new };
      };
    };
  };

  public shared ({ caller }) func deleteEntry(stableId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete manga entries");
    };

    let userMap = getUserMangaMap(caller);
    if (not userMap.containsKey(stableId)) {
      Runtime.trap("Manga entry does not exist");
    };
    userMap.remove(stableId);
  };

  public query ({ caller }) func getEntry(stableId : Nat) : async MangaEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can read manga entries");
    };

    let userMap = getUserMangaMapReadOnly(caller);
    switch (userMap.get(stableId)) {
      case (null) { Runtime.trap("Manga entry does not exist") };
      case (?entry) { entry };
    };
  };

  public query ({ caller }) func getAllEntriesWithStableIds() : async [(Nat, MangaEntry)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view manga entries");
    };

    let userMap = getUserMangaMapReadOnly(caller);
    userMap.toArray();
  };

  public query ({ caller }) func getAllEntries() : async [MangaEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view manga entries");
    };

    let userMap = getUserMangaMapReadOnly(caller);
    userMap.values().toArray();
  };

  public shared ({ caller }) func toggleBookmark(stableId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can toggle bookmarks");
    };

    let userMap = getUserMangaMap(caller);

    switch (userMap.get(stableId)) {
      case (null) { Runtime.trap("Manga entry does not exist") };
      case (?entry) {
        let newEntry = { entry with isBookmarked = not entry.isBookmarked };
        userMap.add(stableId, newEntry);
        newEntry.isBookmarked;
      };
    };
  };

  public shared ({ caller }) func updateNotes(stableId : Nat, newNotes : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update notes");
    };

    let userMap = getUserMangaMap(caller);
    switch (userMap.get(stableId)) {
      case (null) { Runtime.trap("Manga entry does not exist") };
      case (?entry) {
        let updatedEntry = { entry with notes = newNotes };
        userMap.add(stableId, updatedEntry);
        updatedEntry.notes;
      };
    };
  };

  public shared ({ caller }) func updateCompletionStatus(stableId : Nat, completed : Bool) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update completion status");
    };

    let userMap = getUserMangaMap(caller);
    switch (userMap.get(stableId)) {
      case (null) { Runtime.trap("Manga entry does not exist") };
      case (?entry) {
        let updatedEntry = { entry with completed };
        userMap.add(stableId, updatedEntry);
        updatedEntry.completed;
      };
    };
  };

  public shared ({ caller }) func updateRating(stableId : Nat, rating : Float) : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update ratings");
    };

    let userMap = getUserMangaMap(caller);
    switch (userMap.get(stableId)) {
      case (null) { Runtime.trap("Manga entry does not exist") };
      case (?entry) {
        let updatedEntry = { entry with rating };
        userMap.add(stableId, updatedEntry);
        updatedEntry.rating;
      };
    };
  };

  // Store available genres
  var availableGenres : [Text] = [];

  public shared ({ caller }) func updateAvailableGenres(genres : [Text]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update available genres");
    };
    availableGenres := genres;
  };

  public query ({ caller }) func getAvailableGenres() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get available genres");
    };
    availableGenres;
  };

  public shared ({ caller }) func deleteGenre(genreToDelete : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete genres");
    };

    // Remove genre from manga entries
    let userMap = getUserMangaMap(caller);
    let updatedEntriesMap = Map.empty<Nat, MangaEntry>();

    for ((id, entry) in userMap.entries()) {
      if (not entry.genres.any(func(g) { g == genreToDelete })) {
        updatedEntriesMap.add(id, entry);
      } else {
        let filteredGenres = entry.genres.filter(
          func(g) {
            g != genreToDelete;
          }
        );
        updatedEntriesMap.add(id, { entry with genres = filteredGenres });
      };
    };

    userMangaEntries.add(caller, updatedEntriesMap);

    // Remove from available genres
    availableGenres := availableGenres.filter(
      func(g) {
        g != genreToDelete;
      }
    );
  };

  public query ({ caller }) func getAllGenres() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get genres");
    };

    availableGenres;
  };
};
