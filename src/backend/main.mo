import Array "mo:core/Array";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Include blob storage functionality
  include MixinStorage();

  // User profile type
  public type UserProfile = {
    name : Text;
  };

  // Ready Endpoint
  public query ({ caller }) func isReady() : async Bool {
    true;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // User profile functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
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

  // Data types
  type MangaEntry = {
    title : Text;
    alternateTitles : [Text];
    genres : [Text];
    coverImages : [Storage.ExternalBlob];
    synopsis : Text;
    chaptersRead : Nat;
    availableChapters : Nat;
    notes : Text;
    bookmarks : [Nat];
    rating : Float;
    completed : Bool;
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

  // Store manga entries per user (private single-user data model)
  let userMangaEntries = Map.empty<Principal, Map.Map<Text, MangaEntry>>();
  let entriesPerPage = 30;

  // Helper function to get or create user's manga map
  func getUserMangaMap(user : Principal) : Map.Map<Text, MangaEntry> {
    switch (userMangaEntries.get(user)) {
      case (null) {
        let newMap = Map.empty<Text, MangaEntry>();
        userMangaEntries.add(user, newMap);
        newMap;
      };
      case (?existingMap) { existingMap };
    };
  };

  // Manga CRUD operations - all require authenticated user and operate only on caller's data
  public shared ({ caller }) func addEntry(id : Text, manga : MangaEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add manga entries");
    };

    let userMap = getUserMangaMap(caller);
    userMap.add(id, manga);
  };

  public shared ({ caller }) func updateEntry(id : Text, manga : MangaEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update manga entries");
    };

    let userMap = getUserMangaMap(caller);
    switch (userMap.get(id)) {
      case (null) { Runtime.trap("Manga entry does not exist") };
      case (?_) {
        userMap.add(id, manga);
      };
    };
  };

  public shared ({ caller }) func deleteEntry(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete manga entries");
    };

    let userMap = getUserMangaMap(caller);
    if (not userMap.containsKey(id)) {
      Runtime.trap("Manga entry does not exist");
    };
    userMap.remove(id);
  };

  public query ({ caller }) func getEntry(id : Text) : async MangaEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can read manga entries");
    };

    let userMap = getUserMangaMap(caller);
    switch (userMap.get(id)) {
      case (null) { Runtime.trap("Manga entry does not exist") };
      case (?entry) { entry };
    };
  };

  // Pagination - only returns caller's manga entries
  public query ({ caller }) func getMangaPage(pageNumber : Nat) : async MangaPage {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view manga pages");
    };

    let userMap = getUserMangaMap(caller);
    let filteredEntries = userMap.values().toArray().sort(MangaEntry.compareByTitle);
    let totalEntries = filteredEntries.size();
    let totalPages = if (totalEntries == 0) {
      1;
    } else {
      (totalEntries + entriesPerPage - 1) / entriesPerPage;
    };

    if (pageNumber == 0 or pageNumber > totalPages) {
      Runtime.trap("Invalid page number");
    };

    let start = (pageNumber - 1) * entriesPerPage;
    let end = if (pageNumber * entriesPerPage > totalEntries) {
      totalEntries;
    } else {
      pageNumber * entriesPerPage;
    };

    let pagedEntries = filteredEntries.sliceToArray(start, end);

    {
      entries = pagedEntries;
      pageNumber;
      totalPages;
    };
  };

  // Get all entries for the caller
  public query ({ caller }) func getAllEntries() : async [MangaEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view manga entries");
    };

    let userMap = getUserMangaMap(caller);
    userMap.values().toArray();
  };
};
