import { Address, Cell, Dictionary } from '@ton/core';
import { airdropEntryValue } from '../wrappers/Airdrop';
import { NetworkProvider, compile } from '@ton/blueprint';
import { AirdropHelper } from '../wrappers/AirdropHelper';

export async function run(provider: NetworkProvider) {
    // suppose that you have the cell in base64 form stored somewhere
    const dictCell = Cell.fromBase64(
        'te6cckEBAwEAWgACA8/4AgEATyAAb8WCRqh4WT43exJ4opN7a1Ad5yxCScehJ5uHV1Dv8PKF0h26AEAATyABm/c0B0d6fUD143N5GuifQJlguJjzHBUmj1in/C4ev6KLpDt0AEA/Zkmn'
    );
    const dict = dictCell.beginParse().loadDictDirect(Dictionary.Keys.BigUint(256), airdropEntryValue);

    const entryIndex = 1n;

    const proof = dict.generateMerkleProof(entryIndex);
    console.log(Address.parse('EQB6IU8q75MMYFFd6RBla_ymBxrK--QLS6UwXxJoCrTcjmex'))

    const helper = provider.open(
        AirdropHelper.createFromConfig(
            {
                airdrop: Address.parse('kQAzu0C7lVDBMrza8h6GyMICWkxenI94_sD1nRVmf8PFPQKT'),
                index: entryIndex,
                proofHash: proof.hash(),
            },
            await compile('AirdropHelper')
        )
    );
    console.log(helper.address.toString());
    

    if (!(await provider.isContractDeployed(helper.address))) {
        await helper.sendDeploy(provider.sender());
        await provider.waitForDeploy(helper.address,20,5000);
    }

    console.log('sending claim');
    console.log(await provider.isContractDeployed(helper.address));

    
    await helper.sendClaim(1235n, proof); // 123 -> any query_id\

    console.log('claim sent');
    
}
