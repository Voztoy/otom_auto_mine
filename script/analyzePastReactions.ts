import { ethers, getNamedAccounts } from "hardhat";
import { Reactor__factory, OtomsDatabaseV2__factory } from "@/types";
import { parseTokenURI } from "@/utils";

const computeTokenId = (name: string): bigint => {
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(["string"], [name])
    const hashedTokenName = ethers.keccak256(encoded);
    return BigInt(hashedTokenName);
};

const reactionType = "nuclear";

async function main() {
  const { otomReactor, otomDatabase } = await getNamedAccounts();
  const signers = await ethers.getSigners();
  const reactor = Reactor__factory.connect(otomReactor, signers[0]);
  const database = OtomsDatabaseV2__factory.connect(otomDatabase, signers[0]);

  const reactions = await reactor.queryFilter(
    reactor.filters.ReactionAnalysed()
  );

  for (const reaction of reactions) {
    const [reactionId, initiator, result] = reaction.args;
    const success = result[6];
    if (success) {
      const reactionTypes = result[5];
      if (
        reactionTypes &&
        reactionTypes !== null &&
        reactionTypes.length != 0 &&
        reactionTypes.includes(reactionType)
      ) {
        console.log(`Nuclear reaction detected: ${reactionId.toString()} in transaction: ${reaction.transactionHash}`);
        const outputMolecules = result[2];
        const outputAtoms = [];
        for (const molecule of outputMolecules) {
          const otom = parseTokenURI(molecule.tokenUri);
          if (otom) {
            const tokenId = computeTokenId(molecule.molecule.id);
            outputAtoms.push({otom, id: tokenId});
          }
        }
        const inputAtomIds = result[3];
        const inputAtoms = [];
        for (const atomId of inputAtomIds) {
          const otom = parseTokenURI(await database.tokenURI(atomId));
          if (otom) {
            inputAtoms.push({otom, id: atomId});
          } else {
            console.log(`Failed to parse token URI for atom ID: ${atomId}`);
          }
        }

        console.log("Input atoms:");
        console.table(inputAtoms.map((atom) => ({name: atom.otom.name, id: atom.id})));

        console.log("Output atoms:");
        console.table(outputAtoms.map((atom) => ({name: atom.otom.name, id: atom.id})));
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
