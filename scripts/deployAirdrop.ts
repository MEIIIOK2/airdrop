import { Address, address, beginCell, toNano } from '@ton/core';
import { Airdrop, AirdropEntry, generateEntriesDictionary } from '../wrappers/Airdrop';
import { compile, NetworkProvider } from '@ton/blueprint';
import { JettonMinter } from '../wrappers/JettonMinter';
import participants from '../brr_dict.json';

export async function run(provider: NetworkProvider) {
    // console.log(participants);
    
    var entries: AirdropEntry[] = [
        // {
        //     address: Address.parse('UQAN-LBI1Q8LJ8bvYk8UUm9tagO85YhJOPQk83Dq6h3-Hg7l'),
        //     amount: BigInt(1),
        // },
        // {
        //     address: Address.parse('UQDEFEoLd3rkoBMmDlrKg-IOmQ3rAlUmF3bniCYjsDVAfK9t'),
        //     amount: BigInt(2),
        // }
    ];
    // let finalDict: any = []
    participants.forEach(element => {
        try{
            entries.push(
                {
                    address: Address.parse(element.address),
                    amount: toNano(element.amount)
                }
            )
            // finalDict.push(
            //     {
            //         address: element.address,
            //         amount: element.sum
            //     }
            // )
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

    // console.log(entries);
    

    const dict = generateEntriesDictionary(entries);
    console.log(dict);
    console.log(dict.values());

    let bufferObj = Buffer.from('test', "utf8"); 
    console.log(bufferObj.toString("base64"))

    
    const dictCell = beginCell().storeDictDirect(dict).endCell();
    console.log(dictCell.hash().toString('hex'));
    console.log(dictCell.toBoc().toString('hex'));

    console.log(`Dictionary cell (store it somewhere on your backend: ${dictCell.toBoc().toString('base64')}`);
    
    const merkleRoot = BigInt('0x' + dictCell.hash().toString('hex'));
    console.log(merkleRoot);
    

    const jettonMinterAddress = Address.parse('EQDd589R3Uj3yXuNi623aj-BEPfQy4RKs_MCt71ZhwTXhgKX');
    const jettonMinter = provider.open(JettonMinter.createFromAddress(jettonMinterAddress));
    let helperCode = await compile('AirdropHelper');
    console.log('HELPER CODE', helperCode.toBoc().toString('hex'));
    console.log(helperCode.hash());
    console.log(helperCode.bits);
    console.log(helperCode.depth());
    console.log(helperCode.refs);

    
    const airdrop = provider.open(
        Airdrop.createFromConfig(
            {
                merkleRoot,
                helperCode: await compile('AirdropHelper'),
            },
            await compile('Airdrop')
        )
    );
    console.log('Airdrop address', airdrop.address.toRawString());
    
    var fs = require('fs');
    fs.writeFile('data.json', JSON.stringify({address: airdrop.address.toString() ,cell: dictCell.toBoc().toString('base64')}), 'utf8', function(err: any) {
        if (err) throw err;
            console.log('complete');
        });
    
    await airdrop.sendDeploy(provider.sender(), toNano('0.05'), await jettonMinter.getWalletAddressOf(airdrop.address));

    await provider.waitForDeploy(airdrop.address,20,2000);

    // run methods on `airdrop`
}
