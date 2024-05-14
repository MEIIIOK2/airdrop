import { Address, beginCell, toNano } from '@ton/core';
import { Airdrop, AirdropEntry, generateEntriesDictionary } from '../wrappers/Airdrop';
import { compile, NetworkProvider } from '@ton/blueprint';
import { JettonMinter } from '../wrappers/JettonMinter';

export async function run(provider: NetworkProvider) {
    var entries: AirdropEntry[] = [
        {
            address: Address.parse('UQAN-LBI1Q8LJ8bvYk8UUm9tagO85YhJOPQk83Dq6h3-Hg7l'),
            amount: toNano('3'),
        },
        {
            address: Address.parse('UQCEp2lf1Psx4LhVliNLX_iJpoEawzM5HBAXq5gbdVsQDHFm'),
            amount: toNano('3'),
        },
        {
            address: Address.parse('UQD1KtE82GOj2a-RZqT-q1pd40rByBqMF_5gAVg7zskeJ-S_'),
            amount: toNano('3'),
        }
    ];
    // for (let index = 0; index < 15000; index++) {
    //     entries.push({
    //         address: Address.parse('UQAzfuaA6O9PqB68bm8jXRPoEywXEx5jgqTR6xT_hcPX9Gyw'),
    //         amount: toNano('53'),
    //     })
        
    // }

    console.log(entries);
    

    const dict = generateEntriesDictionary(entries);
    const dictCell = beginCell().storeDictDirect(dict).endCell();
    console.log(`Dictionary cell (store it somewhere on your backend: ${dictCell.toBoc().toString('base64')}`);
    const merkleRoot = BigInt('0x' + dictCell.hash().toString('hex'));

    const jettonMinterAddress = Address.parse('EQCrAYQnZsbF2I0j7OTPVX-cILNdLFSqtmhbo82Wc6WcctEc');
    const jettonMinter = provider.open(JettonMinter.createFromAddress(jettonMinterAddress));

    const airdrop = provider.open(
        Airdrop.createFromConfig(
            {
                merkleRoot,
                helperCode: await compile('AirdropHelper'),
            },
            await compile('Airdrop')
        )
    );

    await airdrop.sendDeploy(provider.sender(), toNano('0.05'), await jettonMinter.getWalletAddressOf(airdrop.address));

    await provider.waitForDeploy(airdrop.address,20,2000);

    // run methods on `airdrop`
}
