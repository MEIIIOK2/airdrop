import { Address, address, beginCell, toNano } from '@ton/core';
import { Airdrop, AirdropEntry, generateEntriesDictionary } from '../wrappers/Airdrop';
import { compile, NetworkProvider } from '@ton/blueprint';
import { JettonMinter } from '../wrappers/JettonMinter';
import participants from '../airdrop.json';

export async function run(provider: NetworkProvider) {
    // console.log(participants);
    
    var entries: AirdropEntry[] = []
    //     {
    //         address: Address.parse('UQAN-LBI1Q8LJ8bvYk8UUm9tagO85YhJOPQk83Dq6h3-Hg7l'),
    //         amount: toNano('3'),
    //     },
    //     {
    //         address: Address.parse('UQCEp2lf1Psx4LhVliNLX_iJpoEawzM5HBAXq5gbdVsQDHFm'),
    //         amount: toNano('3'),
    //     },
    //     {
    //         address: Address.parse('UQD1KtE82GOj2a-RZqT-q1pd40rByBqMF_5gAVg7zskeJ-S_'),
    //         amount: toNano('3'),
    //     }
    // ];
    let finalDict: any = []
    participants.forEach(element => {
        try{
            entries.push(
                {
                    address: Address.parse(element.address),
                    amount: toNano(element.sum)
                }
            )
            finalDict.push(
                {
                    address: element.address,
                    amount: element.sum
                }
            )
        }
        catch{
            console.log('wrong address');
            
        }
        
    });
    console.log(entries);
    
    // for (let index = 0; index < 15000; index++) {
    //     entries.push({
    //         address: Address.parse('UQAzfuaA6O9PqB68bm8jXRPoEywXEx5jgqTR6xT_hcPX9Gyw'),
    //         amount: toNano('53'),
    //     })
        
    // }

    console.log(entries);
    

    const dict = generateEntriesDictionary(entries);
    const dictCell = beginCell().storeDictDirect(dict).endCell();
    // console.log(`Dictionary cell (store it somewhere on your backend: ${dictCell.toBoc().toString('base64')}`);
    
    const merkleRoot = BigInt('0x' + dictCell.hash().toString('hex'));

    const jettonMinterAddress = Address.parse('EQABBW_uifkTMvvR0PHq3NoNHDTDoEgSMToU8oaTkO-Hif5A');
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
    var fs = require('fs');
    fs.writeFile('data.json', JSON.stringify({address: airdrop.address.toString() ,cell: dictCell.toBoc().toString('base64'), entries: finalDict}), 'utf8', function(err: any) {
        if (err) throw err;
            console.log('complete');
        });
    
    await airdrop.sendDeploy(provider.sender(), toNano('0.05'), await jettonMinter.getWalletAddressOf(airdrop.address));

    await provider.waitForDeploy(airdrop.address,20,2000);

    // run methods on `airdrop`
}
