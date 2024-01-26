<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $bc_head->bc_no_budget_cost; ?></title>
    <style>
        #table {
            font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;
            border-collapse: collapse;
            width: 100%;
            table-layout:fixed;
        }

        #table2 {
            font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;
        }

        #table td,
        #table th {
            padding: 5px;
        }

        #table tr:nth-child(even) {
            background-color: #f2f2f2;
        }

        #table th {
            padding-top: 10px;
            padding-bottom: 10px;
            text-align: left;
            background-color: #4CAF50;
            color: white;
        }

        #table3 {
            font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;
            font-size: 16px;
        }

        #table3 td,
        #table3 th {
            font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;
            padding: 1px;
        }

        #table3isi {
            font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;
            font-size: 16px;
            width: 100%;
        }

        #table3isi td,
        #table3isi th {
            font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;
            padding: 1px;
        }

        .row {
            display: flex;
            flex-wrap: wrap;
            margin: -10px;
            /* negative margin to offset padding */
        }

        .col {
            box-sizing: border-box;
            /* include padding and border in width */
            padding: 10px;
            flex-grow: 1;
            /* allow columns to expand equally */
        }

        .col-1 {
            flex-basis: calc(8.33% - 20px);
            /* 8.33% width minus padding */
            max-width: calc(8.33% - 20px);
            /* limit max width to 8.33% */
        }

        .col-1-5 {
            flex-basis: calc(12.5% - 20px);
            /* 12.5% width minus padding */
            max-width: calc(12.5% - 20px);
            /* limit max width to 12.5% */
        }

        .logo {
            position: absolute;
            top: 0;
            right: 0;
            float: right;
        }
    </style>
</head>
<?php
if ($bc_head->subsidiary_logo) {
    $path = '' . base_url() . '/media_library/logo/' . $bc_head->subsidiary_logo . '';
} else {
    $path = '' . base_url() . '/assets/assets/img/phintraco-new.jpg';
    $width_image = 'style="width: 5%;"';
}
$type = pathinfo($path, PATHINFO_EXTENSION);
$data = file_get_contents($path);
$base64 = 'data:image/' . $type . ';base64,' . base64_encode($data);

if ($bc_head->size == 'rectangle') {
    $width_image = 'style="width: 10%;"';
} else {
    $width_image = 'style="width: 5%;"';
}
?>

<body>
    <table id="table">
        <tr style="background-color: white;">
            <td colspan="34" style="text-align: center;">
                <div style="margin-bottom: 10px;"><b><?= strtoupper($bc_head->subsidiary_name); ?></b></div>
                <div style="margin-bottom: 10px;"><b>BUDGET COST</b></div>
                <div style="margin-bottom: 10px;"><b>PERIODE <?= $bc_head->bc_periode; ?></b></div>
                <div style="margin-bottom: 10px;"><b><?= $bc_head->bc_no_budget_cost . ' ' . $bc_head->bc_revision; ?></b></div>
                <?php if ($bc_head->class_name != NULL) { ?>
                    <div style="margin-bottom: 10px;"><b><?= strtoupper($bc_head->class_name); ?></b></div>
                <?php } ?>
            </td>
            <td colspan="1" style="text-align: center; vertical-align: middle;">
                <img src="<?php echo $base64 ?>" class="logo" <?= $width_image ?>>
            </td>
        </tr>
        <tr style="background-color: white;">
            <td colspan="36"></td>
        </tr>
        <tr style="background-color: white;">
            <td colspan="36"></td>
        </tr>
        <tr style="background-color: white;">
            <td rowspan="2" style="border-bottom: 1px solid black;border-right: 1px solid black;border-left: 1px solid black;border-top: 1px solid black; text-align: center;"><b>NO</b></td>
            <td colspan="5" rowspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black;border-top: 1px solid black; text-align: center;"><b>Desc</b></td>
            <td colspan="4" style="border-bottom: 1px solid black; border-right: 1px solid black;border-top: 1px solid black; text-align: center;"><b>BUDGET <?= $bc_head->bc_periode - 1; ?></b></td>
            <td colspan="26" style="border-bottom: 1px solid black;border-right: 1px solid black;border-top: 1px solid black;text-align: center;"><b>BUDGET <?= $bc_head->bc_periode; ?></b></td>
        </tr>
        <tr style="background-color: white;">
            <td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: center;"><b>Budget Cost</b></td>
            <td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: center;"><b>Actual Cost</b></td>
            <td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: center;"><b>Jan</b></td>
            <td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: center;"><b>Feb</b></td>
            <td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: center;"><b>Mar</b></td>
            <td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: center;"><b>Apr</b></td>
            <td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: center;"><b>May</b></td>
            <td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: center;"><b>Jun</b></td>
            <td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: center;"><b>Jul</b></td>
            <td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: center;"><b>Aug</b></td>
            <td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: center;"><b>Sep</b></td>
            <td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: center;"><b>Oct</b></td>
            <td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: center;"><b>Nov</b></td>
            <td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: center;"><b>Dec</b></td>
            <td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: center;"><b>TOTAL BUDGET <?= $bc_head->bc_periode; ?></b></td>
        </tr>
        <?php
        $tot_bud_th_lalu = 0;
        $tot_act_th_lalu = 0;
        $tot_jan = 0;
        $tot_feb = 0;
        $tot_mar = 0;
        $tot_apr = 0;
        $tot_mei = 0;
        $tot_jun = 0;
        $tot_jul = 0;
        $tot_agu = 0;
        $tot_sep = 0;
        $tot_okt = 0;
        $tot_nov = 0;
        $tot_des = 0;
        $tot_budget = 0;
        ?>
        <?php foreach ($bc_detail as $bcd) : ?>
            <?php $totalBudget = $bcd->bcd_budget_jan+$bcd->bcd_budget_feb+$bcd->bcd_budget_mar+$bcd->bcd_budget_apr+$bcd->bcd_budget_may+$bcd->bcd_budget_jun+$bcd->bcd_budget_jul+$bcd->bcd_budget_aug+$bcd->bcd_budget_sep+$bcd->bcd_budget_oct+$bcd->bcd_budget_nov+$bcd->bcd_budget_dec  ?>
            <tr>
                <td style="border-bottom: 1px solid black; border-right: 1px solid black; border-left: 1px solid black; text-align: center;"><?= $bcd->bcd_line_code; ?></td>
                <td colspan="5" style="border-bottom: 1px solid black; border-right: 1px solid black;"><?= $bcd->item_name; ?></td>
                <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
                <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($bcd->bcd_budget_cost_tahun_lalu); ?><?php $tot_bud_th_lalu += $bcd->bcd_budget_cost_tahun_lalu ?></td>
                <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
                <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($bcd->bcd_actual_cost_tahun_lalu); ?><?php $tot_act_th_lalu += $bcd->bcd_actual_cost_tahun_lalu ?></td>
                <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
                <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($bcd->bcd_budget_jan); ?><?php $tot_jan += $bcd->bcd_budget_jan ?></td>
                <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
                <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($bcd->bcd_budget_feb); ?><?php $tot_feb += $bcd->bcd_budget_feb ?></td>
                <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
                <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($bcd->bcd_budget_mar); ?><?php $tot_mar += $bcd->bcd_budget_mar ?></td>
                <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
                <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($bcd->bcd_budget_apr); ?><?php $tot_apr += $bcd->bcd_budget_apr ?></td>
                <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
                <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($bcd->bcd_budget_may); ?><?php $tot_mei += $bcd->bcd_budget_may ?></td>
                <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
                <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($bcd->bcd_budget_jun); ?><?php $tot_jun += $bcd->bcd_budget_jun ?></td>
                <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
                <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($bcd->bcd_budget_jul); ?><?php $tot_jul += $bcd->bcd_budget_jul ?></td>
                <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
                <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($bcd->bcd_budget_aug); ?><?php $tot_agu += $bcd->bcd_budget_aug ?></td>
                <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
                <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($bcd->bcd_budget_sep); ?><?php $tot_sep += $bcd->bcd_budget_sep ?></td>
                <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
                <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($bcd->bcd_budget_oct); ?><?php $tot_okt += $bcd->bcd_budget_oct ?></td>
                <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
                <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($bcd->bcd_budget_nov); ?><?php $tot_nov += $bcd->bcd_budget_nov ?></td>
                <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
                <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($bcd->bcd_budget_dec); ?><?php $tot_des += $bcd->bcd_budget_dec ?></td>
                <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
                <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($totalBudget); ?><?php $tot_budget += $totalBudget ?></td>
            </tr>
        <?php endforeach; ?>
        <tr style="background-color: white;">
            <td colspan="6" style="border-bottom: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;"><b>Total</b></td>
            <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
            <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($tot_bud_th_lalu); ?></td>
            <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
            <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($tot_act_th_lalu); ?></td>
            <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
            <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($tot_jan); ?></td>
            <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
            <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($tot_feb); ?></td>
            <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
            <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($tot_mar); ?></td>
            <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
            <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($tot_apr); ?></td>
            <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
            <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($tot_mei); ?></td>
            <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
            <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($tot_jun); ?></td>
            <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
            <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($tot_jul); ?></td>
            <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
            <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($tot_agu); ?></td>
            <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
            <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($tot_sep); ?></td>
            <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
            <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($tot_okt); ?></td>
            <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
            <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($tot_nov); ?></td>
            <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
            <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($tot_des); ?></td>
            <td style="border-bottom: 1px solid black; text-align: left;">Rp.</td>
            <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdfBC($tot_budget); ?></td>
        </tr>
        <tr style="background-color: white;">
            <td colspan="36"></td>
        </tr>
        <tr style="background-color: white;">
            <td colspan="36"><b>Note : </b><br><?= $bc_head->bc_note; ?></td>
        </tr>
    </table>
    <div style="margin-top: 25px;"></div>
    <table style="margin-left: 150px;" id="table2">
        <tr>
            <td width="100">Dibuat di</td>
            <td width="10">:</td>
            <td><?= $bc_head->bc_dibuat_di ?></td>
        </tr>
        <tr>
            <td width="100">Tanggal</td>
            <td width="10">:</td>
            <td><?= $bc_head->bc_date ? tgl_indo_new($bc_head->bc_date) : '-'; ?></td>
        </tr>
    </table>
    <div style="margin-top: 25px;"></div>
    <?php
    $total_approval = count($approval);
    $jarak          = 0;
    if ($total_approval < 4) {
        $jarak = 20;
    } else if ($total_approval < 6) {
        $jarak = 10;
    } else {
        $jarak = 5;
    }
    ?>
    <table style="margin-left: auto; margin-right: auto; width: 60%;" id="table3">
        <tr>
            <th style="text-align:center;vertical-align:top; border-right: 1px solid; border-bottom: 1px solid; border-left: 1px solid; border-top: 1px solid;">PREPARED BY</th>
            <th>&nbsp;</th>
            <th style="text-align:center;vertical-align:top; border-right: 1px solid; border-bottom: 1px solid; border-top: 1px solid; border-left: 1px solid;">CHECKED BY</th>
            <th>&nbsp;</th>
            <th style="text-align:center;vertical-align:top; border-bottom: 1px solid; border-right: 1px solid; border-top: 1px solid; border-left: 1px solid;">APPROVED BY</th>
        </tr>
        <tr>
            <td style="text-align:center;vertical-align:top; border-right: 1px solid; border-left: 1px solid; border-bottom: 1px solid;">
                <table id="table3isi">
                    <tr>
                        <?php foreach ($approval as $key => $apv) : ?>
                            <?php if ($key == 0) { ?>
                                <?php
                                $img_paraf = $bc_head->signature ? $bc_head->signature : 'default-image.png';
                                $path = '' . base_url() . '/media_library/users/' . $img_paraf . '';
                                $type = pathinfo($path, PATHINFO_EXTENSION);
                                $data = file_get_contents($path);
                                $base64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
                                ?>
                                <td>
                                    <table id="table3isi">
                                        <tr>
                                            <td style="text-align: center;"><img src="<?= $base64; ?>" width="80" height="78"></td>
                                        </tr>
                                        <tr>
                                            <td style=" text-align: center;"><?= $bc_head->fullname; ?></td>
                                        </tr>
                                        <tr>
                                            <td style="text-align: center;">
                                                <hr style="border: 1px dotted; width: 50px;" />
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            <?php } ?>
                            <?php if ($apv->group == 'Prepared By') { ?>
                                <?php
                                $img_paraf = $apv->signature ? $apv->signature : 'default-image.png';
                                $path = '' . base_url() . '/media_library/users/' . $img_paraf . '';
                                $type = pathinfo($path, PATHINFO_EXTENSION);
                                $data = file_get_contents($path);
                                $base64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
                                ?>
                                <td>
                                    <table id="table3isi">
                                        <tr>
                                            <?php if ($apv->approval_status == "APPROVE") { ?>
                                                <td style="text-align: center;"><img src="<?= $base64; ?>" width="80" height="78"></td>
                                            <?php } else { ?>
                                                <td style="text-align: center;"><br /><br /><br /><br /></td>
                                            <?php } ?>
                                        </tr>
                                        <tr>
                                            <td style="text-align: center;"><?= $apv->fullname; ?></td>
                                        </tr>
                                        <tr>
                                            <td style="text-align: center;">
                                                <hr style="border: 1px dotted; width: 50px;" />
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            <?php } ?>
                        <?php endforeach; ?>
                    </tr>
                </table>
            </td>
            <td style="width: <?= $jarak; ?>%;">&nbsp;</td>
            <td style="vertical-align: top; border-right: 1px solid; border-bottom: 1px solid; border-left: 1px solid;">
                <table id="table3isi">
                    <tr>
                        <?php foreach ($approval as $key => $apv) : ?>
                            <?php
                            $img_paraf = $apv->signature ? $apv->signature : 'default-image.png';
                            $path = '' . base_url() . '/media_library/users/' . $img_paraf . '';
                            $type = pathinfo($path, PATHINFO_EXTENSION);
                            $data = file_get_contents($path);
                            $base64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
                            ?>
                            <?php if ($apv->group == 'Checked By') { ?>
                                <td>
                                    <table id="table3isi">
                                        <tr>
                                            <?php if ($apv->approval_status == "APPROVE") { ?>
                                                <td style="text-align: center;"><img src="<?= $base64; ?>" width="80" height="78"></td>
                                            <?php } else { ?>
                                                <td style="text-align: center;"><br /><br /><br /><br /></td>
                                            <?php } ?>
                                        </tr>
                                        <tr>
                                            <td style="text-align: center;"><?= $apv->fullname; ?></td>
                                        </tr>
                                        <tr>
                                            <td style="text-align: center;">
                                                <hr style="border: 1px dotted; width: 50px;" />
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            <?php } ?>
                        <?php endforeach; ?>
                    </tr>
                </table>
            </td>
            <td style="width: <?= $jarak; ?>%;"></td>
            <td style="vertical-align: top; border-right: 1px solid; border-bottom: 1px solid; border-left: 1px solid;">
                <table id="table3isi">
                    <?php foreach ($approval as $key => $apv) : ?>
                        <?php
                        $img_paraf = $apv->signature ? $apv->signature : 'default-image.png';
                        $path = '' . base_url() . '/media_library/users/' . $img_paraf . '';
                        $type = pathinfo($path, PATHINFO_EXTENSION);
                        $data = file_get_contents($path);
                        $base64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
                        ?>
                        <?php if ($apv->group == 'Approved By') { ?>
                            <td>
                                <table id="table3isi">
                                    <tr>
                                        <?php if ($apv->approval_status == "APPROVE") { ?>
                                            <td style="text-align: center;"><img src="<?= $base64; ?>" width="80" height="78"></td>
                                        <?php } else { ?>
                                            <td style="text-align: center;"><br /><br /><br /><br /></td>
                                        <?php } ?>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;"><?= $apv->fullname; ?></td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">
                                            <hr style="border: 1px dotted; width: 50px;" />
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        <?php } ?>
                    <?php endforeach; ?>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>