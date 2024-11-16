// HTMLエスケープ処理
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

$(document).ready(function () {
    // フォームを動的に生成
    for (let i = 1; i <= 10; i++) {
        $('#playerInputs').append(`
            <div class="form-group row">
                <div class="col-xs-3">
                    <input type="text" id="playerName${i}" class="form-control" placeholder="プレイヤー${i}">
                </div>
                <div class="col-xs-3">
                    <label for="tankRank${i}" class="label label-warning">Tank</label>
                    <select id="tankRank${i}" class="form-control">
                        <option value="0">やりたくない</option>
                        ${Array.from({ length: 35 }, (_, index) => `
                            <option value="${index + 1}">
                                ${["ブロンズ", "シルバー", "ゴールド", "プラチナ", "ダイヤ", "マスター", "グランドマスター"][Math.floor(index / 5)]}${5 - index % 5}
                            </option>`).join('')}
                    </select>
                </div>
                <div class="col-xs-3">
                    <label for="dpsRank${i}" class="label label-info">DPS</label>
                    <select id="dpsRank${i}" class="form-control">
                        <option value="0">やりたくない</option>
                        ${Array.from({ length: 35 }, (_, index) => `
                            <option value="${index + 1}">
                                ${["ブロンズ", "シルバー", "ゴールド", "プラチナ", "ダイヤ", "マスター", "グランドマスター"][Math.floor(index / 5)]}${5 - index % 5}
                            </option>`).join('')}
                    </select>
                </div>
                <div class="col-xs-3">
                    <label for="supportRank${i}" class="label label-success">Support</label>
                    <select id="supportRank${i}" class="form-control">
                        <option value="0">やりたくない</option>
                        ${Array.from({ length: 35 }, (_, index) => `
                            <option value="${index + 1}">
                                ${["ブロンズ", "シルバー", "ゴールド", "プラチナ", "ダイヤ", "マスター", "グランドマスター"][Math.floor(index / 5)]}${5 - index % 5}
                            </option>`).join('')}
                    </select>
                </div>
            </div>
        `);
    }

    // 前回のロール選択を記憶するオブジェクト
    const previousRoles = {};

    // チーム振り分け
    $("#assignTeams").click(function () {
        let players = [];

        // プレイヤー情報収集
        for (let i = 1; i <= 10; i++) {
            const name = escapeHtml($(`#playerName${i}`).val() || `プレイヤー${i}`);
            const tank = parseInt($(`#tankRank${i}`).val());
            const dps = parseInt($(`#dpsRank${i}`).val());
            const support = parseInt($(`#supportRank${i}`).val());
            players.push({ name, tank, dps, support });
        }

        // シャッフル機能
        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        // ロールごとにフィルタリングを行う
        function getNextEligiblePlayers(role, allPlayers) {
            const eligiblePlayers = allPlayers.filter(player => {
                const previousRole = previousRoles[player.name];
                return player[role] > 0 && previousRole !== role;
            });

            // フィルタ後の候補が不足している場合、前回のロール制約を無視して再度フィルタリング
            if (eligiblePlayers.length < 2) {
                return allPlayers.filter(player => player[role] > 0);
            }
            return eligiblePlayers;
        }

        // ロールごとにソートし、ランクの近いプレイヤーをランダムに選択
        const roles = ['tank', 'dps', 'dps', 'support', 'support'];
        const blueTeam = [];
        const redTeam = [];
        let blueTeamPower = 0;
        let redTeamPower = 0;

        roles.forEach(role => {
            // フィルタリングして「やりたくない」と連続ロールを除外
            const eligiblePlayers = getNextEligiblePlayers(role, players);

            // 振り分け可能なプレイヤーがいない場合はスキップ
            if (eligiblePlayers.length < 2) {
                console.error(`Not enough eligible players for role: ${role}`);
                return;
            }

            // ロールでソート
            eligiblePlayers.sort((a, b) => a[role] - b[role]);

            // ランダム性を持たせて選択
            const shuffledPlayers = shuffle(eligiblePlayers);

            // 最初の2人を選択
            const bluePlayer = shuffledPlayers[0];
            const redPlayer = shuffledPlayers[1];

            blueTeam.push({ name: bluePlayer.name, role });
            redTeam.push({ name: redPlayer.name, role });

            // 戦闘力の合計値を加算
            blueTeamPower += bluePlayer[role];
            redTeamPower += redPlayer[role];

            // 前回のロールを記憶
            previousRoles[bluePlayer.name] = role;
            previousRoles[redPlayer.name] = role;

            // 選ばれたプレイヤーを除外
            players = players.filter(p => p.name !== bluePlayer.name && p.name !== redPlayer.name);
        });

        // チームを表示（Tank → DPS → DPS → Support → Support）
        const roleColors = {
            tank: "label-warning",
            dps: "label-info",
            support: "label-success",
        };

        $("#blueTeam").html(
            blueTeam.map(player =>
                `<li class="list-group-item">
                    <span class="label ${roleColors[player.role]}">${escapeHtml(player.role.toUpperCase())}</span>
                    ${escapeHtml(player.name)}
                </li>`
            ).join("")
        );

        $("#redTeam").html(
            redTeam.map(player =>
                `<li class="list-group-item">
                    <span class="label ${roleColors[player.role]}">${escapeHtml(player.role.toUpperCase())}</span>
                    ${escapeHtml(player.name)}
                </li>`
            ).join("")
        );


        // 戦闘力の合計値を表示
        $("#blueTeamPower").text(`合計戦闘力: ${blueTeamPower}`);
        $("#redTeamPower").text(`合計戦闘力: ${redTeamPower}`);
    });
});
