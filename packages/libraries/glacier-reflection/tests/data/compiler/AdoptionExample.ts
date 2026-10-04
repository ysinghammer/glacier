import {
  DESIGN_PARAMETER_TYPES_METADATA,
  DESIGN_RETURN_TYPE_METADATA,
  DESIGN_TYPE_METADATA,
  ListMetadataDefinition,
  MetadataDiscovery,
  RecordMetadataDefinition,
  ValueMetadataDefinition,
} from "@glacier/reflection";

/** An erased interface needs an explicitly supplied runtime dependency identity. */
interface IRepository {
  load(): string;
}

/** Executable documentation using only the generated package-root public contract. */
export class AdoptionExample {
  /** Checks adoption outcomes without resolving dependencies or constructing a consumer. */
  public static run(): number {
    let checks = 0;
    const check = (isSatisfied: boolean): void => {
      if (!isSatisfied) throw new Error(`Adoption example failed at check ${checks + 1}`);
      checks += 1;
    };
    const label = new ValueMetadataDefinition<string | undefined>("label");
    const tags = new ListMetadataDefinition<string>("tags");
    const people = new RecordMetadataDefinition<{ name: string }>("people");
    const dependency = new ValueMetadataDefinition<symbol>("dependency");
    const repositoryIdentity = Symbol("repository");

    @label.decorator("base")
    class Base {
      @label.decorator("Describe")
      public describe(input: string): string {
        return input;
      }
    }
    class Derived extends Base {}
    check(tags.set(Base, ["a", "b"]).isValid);
    const contribution = ["b", "c"];
    check(tags.set(Derived, contribution).isValid);
    contribution.push("not stored");
    const instance = new Derived();
    const inheritedTags = tags.read(instance);
    check(
      inheritedTags.isValid &&
        inheritedTags.isPresent &&
        inheritedTags.value.join(",") === "a,b,b,c" &&
        Object.isFrozen(inheritedTags.value),
    );
    const ownTags = tags.read(instance, { kind: "class", inheritance: "own" });
    check(ownTags.isValid && ownTags.isPresent && ownTags.value.join(",") === "b,c");
    check(tags.set(Derived, []).isValid);
    const emptyOwn = tags.read(instance);
    check(emptyOwn.isValid && emptyOwn.isPresent && emptyOwn.value.join(",") === "a,b");
    const person = { name: "Ada" };
    const suppliedPeople = { owner: person };
    check(people.set(Base, suppliedPeople).isValid);
    suppliedPeople.owner = { name: "not stored" };
    const persons = people.read(instance);
    check(
      persons.isValid &&
        persons.isPresent &&
        persons.value["owner"] === person &&
        persons.value["missing"] === undefined &&
        Object.isFrozen(persons.value),
    );
    person.name = "Ada Lovelace";
    check(persons.isValid && persons.isPresent && persons.value["owner"]?.name === "Ada Lovelace");
    check(label.set(Derived, undefined).isValid);
    const presentUndefined = label.read(instance);
    check(
      presentUndefined.isValid &&
        presentUndefined.isPresent &&
        presentUndefined.value === undefined,
    );
    check(label.has(instance).isValid);
    const member = label.read(instance, { kind: "member", member: "describe" });
    check(member.isValid && member.isPresent && member.value === "Describe");
    const ownMember = label.read(instance, {
      kind: "member",
      member: "describe",
      inheritance: "own",
    });
    check(ownMember.isValid && !ownMember.isPresent);
    const definitions = MetadataDiscovery.definitions(instance);
    check(definitions.isValid && definitions.definitions.includes(label));
    const locations = label.locations(instance);
    check(locations.isValid && locations.addresses.some((address) => address.kind === "member"));
    if (locations.isValid) {
      for (const address of locations.addresses) {
        const discovered = label.readDynamic(instance, address);
        check(discovered.isValid && discovered.isPresent);
      }
    }
    const erasedName: string = "describe";
    const dynamic = label.readDynamic(instance, { kind: "member", member: erasedName });
    check(dynamic.isValid && dynamic.isPresent && dynamic.value === "Describe");
    Object.defineProperty(instance, "constructor", {
      get: () => {
        throw new Error("Instance-owned constructor must not be inspected");
      },
    });
    const alias = label.read(instance);
    check(alias.isValid && alias.isPresent && alias.value === undefined);
    const deleted = label.delete(Derived);
    check(deleted.isValid && deleted.isDeleted);
    const revealed = label.read(new Derived());
    check(revealed.isValid && revealed.isPresent && revealed.value === "base");

    @label.decorator("consumer")
    class Consumer {
      public constructor(
        @dependency.decorator(repositoryIdentity) readonly repository: IRepository,
      ) {}
    }
    const explicit = dependency.read(Consumer, {
      kind: "constructor-parameter",
      position: 0,
      inheritance: "own",
    });
    check(explicit.isValid && explicit.isPresent && explicit.value === repositoryIdentity);
    const emitted = DESIGN_PARAMETER_TYPES_METADATA.read(Consumer, {
      kind: "class",
      inheritance: "own",
    });
    check(
      emitted.isValid &&
        emitted.isPresent &&
        emitted.value.length === 1 &&
        emitted.value[0] === Object &&
        Object.isFrozen(emitted.value),
    );
    const memberType = DESIGN_TYPE_METADATA.read(Base, { kind: "member", member: "describe" });
    check(memberType.isValid && memberType.isPresent && memberType.value === Function);
    const returned = DESIGN_RETURN_TYPE_METADATA.read(Base, { kind: "member", member: "describe" });
    check(returned.isValid && returned.isPresent && returned.value === String);
    class ChangedConsumer extends Consumer {
      public constructor() {
        super({ load: () => "unused" });
      }
    }
    const positional = dependency.readDynamic(ChangedConsumer, {
      kind: "constructor-parameter",
      position: 0,
    });
    check(positional.isValid && positional.isPresent && positional.value === repositoryIdentity);
    const ownDependency = dependency.readDynamic(ChangedConsumer, {
      kind: "constructor-parameter",
      position: 0,
      inheritance: "own",
    });
    check(ownDependency.isValid && !ownDependency.isPresent);
    return checks;
  }
}
