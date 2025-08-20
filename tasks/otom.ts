import { task } from "hardhat/config";
import { parseTokenURI } from "@/utils";

task("otom:mint", "Mint OTOM NFTs")
  .addOptionalParam("amount", "The amount of NFTs to mint", "5")
  .addOptionalParam("from", "The address to mint from")
  .setAction(async ({ amount, from }, { ethers, getNamedAccounts }) => {
    const sender = from
      ? await ethers.getSigner(from)
      : (await ethers.getSigners())[0];

    const args = {
      address: sender.address,
      universeHash:
        "0xfda008503288e5abc370328150d20993fec26efe5707f2d12ab552ebb0da5e26",
      amount: amount, // This can fetched by calling "miningLimit" on OTOMs contract. Currently limit is 5 - though server doesn't validate this.
    };
    const miningResponse = await fetch("https://www.otom.xyz/api/miningArgs", {
      body: JSON.stringify(args),
      method: "POST",
    });
    const miningData = JSON.parse(await miningResponse.json());
    const abi = [
      "function mine(((string,string,bytes32,uint256,uint256,(uint256,string),(uint256,uint256,uint256,uint256,uint256,bool,string,string,uint256,uint256,(bytes32,uint256,uint256,uint256,uint256,uint256[],uint256[],uint256[],uint256[]),(uint256,uint256,uint256,uint256,string))[],(uint256,uint256,uint256,uint256,uint256,bool,string,string,uint256,uint256,(bytes32,uint256,uint256,uint256,uint256,uint256[],uint256[],uint256[],uint256[]),(uint256,uint256,uint256,uint256,string))[],uint256,uint256,uint256,uint256,uint256),bytes32,string,bytes32,uint256,bytes)[] _payloads)",
      "event OtomMined(address indexed minedBy, bytes32 indexed universeHash, uint256 indexed atomId, bytes32 creationHash)",
    ];
    const { otomToken } = await getNamedAccounts();
    const contract = new ethers.Contract(otomToken, abi, sender);

    // Format the mining data into the expected structure
    const formattedArgs = miningData.json.args.map((arg) => [
      [
        arg.minedMolecule.id,
        arg.minedMolecule.name,
        arg.minedMolecule.universeHash,
        arg.minedMolecule.activationEnergy,
        arg.minedMolecule.radius,
        [arg.minedMolecule.bond.strength, arg.minedMolecule.bond.bondType],
        arg.minedMolecule.givingAtoms.map((atom) => [
          atom.radius,
          atom.volume,
          atom.mass,
          atom.density,
          atom.electronegativity,
          atom.metallic,
          atom.name,
          atom.series,
          atom.periodicTableX,
          atom.periodicTableY,
          [
            atom.structure.universeHash,
            atom.structure.depth,
            atom.structure.distance,
            atom.structure.distanceIndex,
            atom.structure.shell,
            atom.structure.totalInOuter,
            atom.structure.emptyInOuter,
            atom.structure.filledInOuter,
            atom.structure.ancestors,
          ],
          [
            atom.nucleus.protons,
            atom.nucleus.neutrons,
            atom.nucleus.nucleons,
            atom.nucleus.stability,
            atom.nucleus.decayType,
          ],
        ]),
        arg.minedMolecule.receivingAtoms,
        arg.minedMolecule.activationEnergy,
        arg.minedMolecule.thermalConductivity,
        arg.minedMolecule.toughness,
        arg.minedMolecule.hardness,
        arg.minedMolecule.ductility,
      ],
      arg.miningHash,
      arg.tokenUri,
      arg.universeHash,
      arg.expiry,
      arg.signature,
    ]);

    // Send transaction
    const tx = await contract.mine(formattedArgs, {
      gasPrice: ethers.parseUnits("0.00001225", "gwei"),
      gasLimit: 820000,
    });
    console.log("Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed. Minted:");
    const minted: { otom: string; id: string }[] = [];
    receipt.logs.forEach((log) => {
      const parsed = contract.interface.parseLog(log);
      if (parsed !== null && parsed?.args?.atomId) {
        minted.push({
          otom: miningData.json.args[minted.length].minedMolecule.name,
          id: parsed.args.atomId.toString(),
        });
      }
    });
    console.table(minted);
  });

task("otom:burn", "Annihilate OTOM for Energy")
  .addOptionalParam("from", "The address to burn from")
  .addVariadicPositionalParam("ids", "The IDs of the OTOMs to burn")
  .setAction(async ({ ids, from }, { ethers, getNamedAccounts }) => {
    const sender = from
      ? await ethers.getSigner(from)
      : (await ethers.getSigners())[0];

    const abi = ["function annihilate(uint256[] atomIds)"];
    const { otomAnnihilator } = await getNamedAccounts();
    const contract = new ethers.Contract(otomAnnihilator, abi, sender);

    // Send transaction
    const tx = await contract.annihilate(ids.map((id) => ethers.toBigInt(id)));
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
  });

task("otom:react", "React OTOMs with Energy")
  .addOptionalParam("from", "The address to react from")
  .addVariadicPositionalParam("ids", "The IDs of the OTOMs to react")
  .addParam("energy", "The amount of energy to react with")
  .addFlag("noAnalyze", "Skip the analysis step")
  .setAction(
    async (
      { ids, energy, from, noAnalyze },
      { ethers, getNamedAccounts, run }
    ) => {
      const sender = from
        ? await ethers.getSigner(from)
        : (await ethers.getSigners())[0];

      const otomReactorABI = [
        "function initiateReaction(uint256[] atomIds, uint256 energyAmount)",
      ];
      const OtomReactionOutputABI = [
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
      ];
      const { otomReactor, otomReactionOutput } = await getNamedAccounts();
      const reactorContract = new ethers.Contract(
        otomReactor,
        otomReactorABI,
        sender
      );
      const outputContract = new ethers.Contract(
        otomReactionOutput,
        OtomReactionOutputABI,
        sender
      );

      // Send transaction
      const tx = await reactorContract.initiateReaction(
        ids,
        ethers.parseEther(energy)
      );
      console.log("Reaction transaction hash:", tx.hash);
      const receipt = await tx.wait();
      let reactionId: bigint | undefined;
      receipt.logs.forEach((log) => {
        try {
          const parsed = outputContract.interface.parseLog(log);
          if (parsed !== null && parsed?.args?.tokenId) {
            reactionId = parsed.args.tokenId;
          }
        } catch (e) {
            // Note: The above sometimes blows up on parsing. Likely due to conflicting topic0, should filter by log address
            // TODO: Fix the above parsing to include address. Bigger fish to fry right now.
        }
      });
      console.log(`Reaction confirmed. Minted reaction: ${reactionId}`);

      if (!noAnalyze && reactionId) {
        await run("otom:analyze", { ids: [reactionId.toString()] });
      }
    }
  );

task("otom:analyze", "Analyze OTOM reaction")
  .addVariadicPositionalParam("ids", "unrealized reaction ids")
  .addOptionalParam("from", "The address to analyze from")
  .setAction(async ({ ids, from }, { ethers, getNamedAccounts }) => {
    const sender = from
      ? await ethers.getSigner(from)
      : (await ethers.getSigners())[0];

    const body = {
      address: sender.address,
      unanalysedResultIds: ids,
    };
    const analysisResponse = await fetch(
      "https://www.otom.xyz/api/analyseArgs",
      {
        body: JSON.stringify(body),
        method: "POST",
      }
    );
    const analysisData = JSON.parse(await analysisResponse.json());
    const abi = [
      "function analyseReactions((bytes32,uint256,((string,string,bytes32,uint256,uint256,(uint256,string),(uint256,uint256,uint256,uint256,uint256,bool,string,string,uint256,uint256,(bytes32,uint256,uint256,uint256,uint256,uint256[],uint256[],uint256[],uint256[]),(uint256,uint256,uint256,uint256,string))[],(uint256,uint256,uint256,uint256,uint256,bool,string,string,uint256,uint256,(bytes32,uint256,uint256,uint256,uint256,uint256[],uint256[],uint256[],uint256[]),(uint256,uint256,uint256,uint256,string))[],uint256,uint256,uint256,uint256,uint256),string)[],uint256[],uint256,string[],bool)[] reactionResults, uint256 expiry, bytes signature)",
    ];
    const { otomReactor } = await getNamedAccounts();
    const contract = new ethers.Contract(otomReactor, abi, sender);

    const convertInputToOutput = (input: any) => {
      return [
        input.json.args[0].map((reaction: any) => [
          reaction.universeHash,
          reaction.reactionOutputId,
          reaction.outputMolecules.map((molecule: any) => [
            [
              molecule.molecule.id,
              molecule.molecule.name,
              molecule.molecule.universeHash,
              molecule.molecule.activationEnergy,
              molecule.molecule.radius,
              [
                molecule.molecule.bond.strength,
                molecule.molecule.bond.bondType,
              ],
              molecule.molecule.givingAtoms.map((atom: any) => [
                atom.radius,
                atom.volume,
                atom.mass,
                atom.density,
                atom.electronegativity,
                atom.metallic,
                atom.name,
                atom.series,
                atom.periodicTableX,
                atom.periodicTableY,
                [
                  atom.structure.universeHash,
                  atom.structure.depth,
                  atom.structure.distance,
                  atom.structure.distanceIndex,
                  atom.structure.shell,
                  atom.structure.totalInOuter,
                  atom.structure.emptyInOuter,
                  atom.structure.filledInOuter,
                  atom.structure.ancestors,
                ],
                [
                  atom.nucleus.protons,
                  atom.nucleus.neutrons,
                  atom.nucleus.nucleons,
                  atom.nucleus.stability,
                  atom.nucleus.decayType,
                ],
              ]),
              molecule.molecule.receivingAtoms,
              molecule.molecule.electricalConductivity,
              molecule.molecule.thermalConductivity,
              molecule.molecule.toughness,
              molecule.molecule.hardness,
              molecule.molecule.ductility,
            ],
            molecule.tokenUri,
          ]),
          reaction.inputAtomIds,
          reaction.remainingEnergy,
          reaction.reactionTypes,
          reaction.success,
        ]),
        input.json.args[1],
        input.json.args[2],
      ];
    };

    // Send transaction
    const tx = await contract.analyseReactions(
      ...convertInputToOutput(analysisData)
    );
    console.log("Analysis transaction hash:", tx.hash);
    await tx.wait();
  });

task("otom:fetch", "Fetch OTOM metadata")
  .addPositionalParam("id", "Token ID to fetch")
  .setAction(async ({ id }, { ethers, getNamedAccounts }) => {
    const { otomDatabase } = await getNamedAccounts();
    const signers = await ethers.getSigners();
    const contract = new ethers.Contract(otomDatabase, ["function tokenURI(uint256 tokenId) returns (string)"], signers[0]);
    const uri = await contract.tokenURI(id);
    const otom = parseTokenURI(uri);
    console.log(otom);
  });
