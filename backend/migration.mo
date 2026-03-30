module {
  type OldActor = {
    // No state changes
  };
  type NewActor = {
    // No state changes
  };
  public func run(old : OldActor) : NewActor {
    old;
  };
};
